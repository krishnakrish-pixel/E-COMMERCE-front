import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { api } from '../api/client';
import { useAuth } from './AuthContext';
import type { Product } from './CartContext';

export type WishlistResult = 'added' | 'removed' | 'login' | 'error';

interface WishlistContextType {
  wishlist: Product[];
  loading: boolean;
  isInWishlist: (productId: number) => boolean;
  /** 'login' means the visitor is not signed in, the caller decides where to send them. */
  toggleWishlist: (product: Product) => Promise<WishlistResult>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const normalize = (list: Product[]) => list.map((p) => ({ ...p, price: Number(p.price) }));

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setWishlist([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api<Product[]>('/wishlist')
      .then((list) => !cancelled && setWishlist(normalize(list)))
      .catch((e) => console.error('Failed to load wishlist', e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const isInWishlist = (productId: number) => wishlist.some((p) => p.id === productId);

  const toggleWishlist = async (product: Product): Promise<WishlistResult> => {
    if (!user) return 'login';
    const has = isInWishlist(product.id);
    try {
      const list = await api<Product[]>(`/wishlist/${product.id}`, { method: has ? 'DELETE' : 'POST' });
      setWishlist(normalize(list));
      return has ? 'removed' : 'added';
    } catch (e: any) {
      toast.error(e.message || 'Could not update your wishlist');
      return 'error';
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlist, loading, isInWishlist, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
