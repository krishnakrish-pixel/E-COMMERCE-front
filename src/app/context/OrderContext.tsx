import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { api } from '../api/client';
import { useAuth } from './AuthContext';
import type { CartItem } from './CartContext';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  discount?: number;
  couponCode?: string | null;
  paymentMethod?: 'card' | 'upi' | 'cod';
  shipping: number;
  tax: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  history?: { status: string; note: string; createdAt: string }[];
  returnStatus?: 'requested' | 'approved' | 'rejected' | null;
  returnReason?: string | null;
}

export interface CreateOrderInput {
  items: CartItem[];
  shippingAddress: Order['shippingAddress'];
  paymentMethod?: 'card' | 'upi' | 'cod';
  couponCode?: string;
}

interface OrderContextType {
  orders: Order[];
  loading: boolean;
  createOrder: (orderData: CreateOrderInput) => Promise<Order>;
  getOrderById: (id: string) => Order | undefined;
  getUserOrders: (userId: string) => Order[];
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<boolean>;
  refreshOrders: () => Promise<void>;
  /** Customer asks to return a delivered order. Resolves true on success (an error message is shown otherwise). */
  requestReturn: (orderId: string, reason: string) => Promise<boolean>;
  /** Admin approves / rejects a return request. */
  decideReturn: (orderId: string, decision: 'approve' | 'reject') => Promise<boolean>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Money comes back from MySQL as decimals, make sure the UI always gets numbers
const normalizeOrder = (o: Order): Order => ({
  ...o,
  subtotal: Number(o.subtotal),
  discount: Number(o.discount ?? 0),
  shipping: Number(o.shipping),
  tax: Number(o.tax),
  total: Number(o.total),
  items: (o.items || []).map((i) => ({ ...i, price: Number(i.price) })),
});

export function OrderProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(!!user);

  const refreshOrders = async () => {
    if (!user) {
      setOrders([]);
      return;
    }
    setLoading(true);
    try {
      // admins see every order, customers only their own
      const data = await api<Order[]>(user.role === 'admin' ? '/orders' : '/orders/my');
      setOrders(data.map(normalizeOrder));
    } catch (e: any) {
      console.error('Failed to load orders', e);
      toast.error(e.message || 'Could not load your orders');
    } finally {
      setLoading(false);
    }
  };

  // (re)load whenever someone signs in / out
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }
    refreshOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]);

  const createOrder = async (orderData: CreateOrderInput) => {
    const created = await api<Order>('/orders', {
      method: 'POST',
      body: {
        items: orderData.items.map((i) => ({ productId: i.id, quantity: i.quantity })),
        shippingAddress: orderData.shippingAddress,
        paymentMethod: orderData.paymentMethod,
        couponCode: orderData.couponCode || undefined,
      },
    });
    const order = normalizeOrder(created);
    setOrders((prev) => [order, ...prev]);
    return order;
  };

  const replaceOrder = (updated: Order) =>
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? normalizeOrder(updated) : o)));

  const requestReturn = async (orderId: string, reason: string) => {
    try {
      replaceOrder(await api<Order>(`/orders/${orderId}/return`, { method: 'POST', body: { reason } }));
      return true;
    } catch (e: any) {
      toast.error(e.message || 'Could not send your return request');
      return false;
    }
  };

  const decideReturn = async (orderId: string, decision: 'approve' | 'reject') => {
    try {
      replaceOrder(await api<Order>(`/orders/${orderId}/return`, { method: 'PUT', body: { decision } }));
      return true;
    } catch (e: any) {
      toast.error(e.message || 'Could not save your decision');
      return false;
    }
  };

  const getOrderById = (id: string) => {
    return orders.find((order) => order.id === id);
  };

  const getUserOrders = (userId: string) => {
    return orders.filter((order) => order.userId === userId);
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const updated = await api<Order>(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: { status },
      });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? normalizeOrder(updated) : o)));
      return true;
    } catch (e: any) {
      toast.error(e.message || 'Could not update the order');
      return false;
    }
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        loading,
        createOrder,
        getOrderById,
        getUserOrders,
        updateOrderStatus,
        refreshOrders,
        requestReturn,
        decideReturn,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}
