import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { toast } from 'sonner';
import { api } from '../api/client';
import { useAuth } from './AuthContext';
import { maxQuantity } from '../lib/stock';

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  description: string;
  /** units left; null / undefined = not tracked */
  stock?: number | null;
  reviewCount?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  /** Resolves true when the item was added (false = refused, e.g. not enough stock; a message is shown). */
  addToCart: (product: Product, quantity?: number) => Promise<boolean>;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_CART_KEY = 'shophub_cart';

const readLocalCart = (): CartItem[] => {
  try {
    const saved = localStorage.getItem(LOCAL_CART_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const normalize = (items: CartItem[]): CartItem[] =>
  items.map((i) => ({ ...i, price: Number(i.price) }));

/**
 * - Guests: cart lives in localStorage (so people can browse and add items before signing in).
 * - Logged-in users: cart is stored in MySQL through the backend.
 *   When a guest signs in, the local cart is merged into their saved cart.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>(readLocalCart);
  const loggedIn = !!user;
  const loggedInRef = useRef(loggedIn);
  loggedInRef.current = loggedIn;

  // Load / merge the cart whenever the logged-in user changes
  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setCart(readLocalCart());
      return;
    }

    (async () => {
      try {
        const local = readLocalCart();
        const server =
          local.length > 0
            ? await api<CartItem[]>('/cart/merge', {
                method: 'POST',
                body: { items: local.map((i) => ({ productId: i.id, quantity: i.quantity })) },
              })
            : await api<CartItem[]>('/cart');
        if (!cancelled) {
          setCart(normalize(server));
          localStorage.removeItem(LOCAL_CART_KEY);
        }
      } catch (e) {
        console.error('Failed to load cart from server', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Guests only: keep the cart in localStorage
  useEffect(() => {
    if (loggedIn) return;
    try {
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cart, loggedIn]);

  /** Runs a server call for logged-in users; on failure, re-syncs from the server. */
  const syncServer = async (call: () => Promise<CartItem[] | void>) => {
    if (!loggedInRef.current) return;
    try {
      const result = await call();
      if (Array.isArray(result)) setCart(normalize(result));
    } catch (e: any) {
      toast.error(e.message || 'Could not update your cart');
      try {
        setCart(normalize(await api<CartItem[]>('/cart')));
      } catch {
        /* ignore */
      }
    }
  };

  const stockMessage = (name: string, limit: number) =>
    limit <= 0 ? `${name} is out of stock` : `Only ${limit} left in stock for ${name}`;

  const addToCart = async (product: Product, quantity: number = 1): Promise<boolean> => {
    const qtyToAdd = Math.max(1, quantity);

    if (loggedInRef.current) {
      // Signed in: the server decides (it knows the real stock) and returns the new cart.
      try {
        const updated = await api<CartItem[]>('/cart/items', {
          method: 'POST',
          body: { productId: product.id, quantity: qtyToAdd },
        });
        setCart(normalize(updated));
        return true;
      } catch (e: any) {
        toast.error(e.message || 'Could not add this item to your cart');
        return false;
      }
    }

    // Guest: keep it in the browser, but still respect the stock we know about.
    const existing = cart.find((item) => item.id === product.id);
    const limit = maxQuantity(product);
    if ((existing?.quantity ?? 0) + qtyToAdd > limit) {
      toast.error(stockMessage(product.name, limit));
      return false;
    }
    setCart((prevCart) => {
      const found = prevCart.find((item) => item.id === product.id);
      if (found) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, ...product, quantity: item.quantity + qtyToAdd } : item
        );
      }
      return [...prevCart, { ...product, quantity: qtyToAdd }];
    });
    return true;
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
    syncServer(() => api<CartItem[]>(`/cart/items/${productId}`, { method: 'DELETE' }));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const current = cart.find((item) => item.id === productId);
    if (current) {
      const limit = maxQuantity(current);
      if (quantity > limit) {
        toast.error(stockMessage(current.name, limit));
        return;
      }
    }
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === productId ? { ...item, quantity } : item))
    );
    syncServer(() =>
      api<CartItem[]>(`/cart/items/${productId}`, { method: 'PUT', body: { quantity } })
    );
  };

  const clearCart = () => {
    setCart([]);
    syncServer(() => api('/cart', { method: 'DELETE' }));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
