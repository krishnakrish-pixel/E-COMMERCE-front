import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '../api/client';
import type { Product } from './CartContext';

export interface ProductInput {
  name: string;
  price: number;
  category: string;
  description?: string;
  image?: string;
  rating?: number;
  stock?: number;
}

interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
  createProduct: (input: ProductInput) => Promise<Product>;
  updateProduct: (id: number, input: ProductInput) => Promise<Product>;
  deleteProduct: (id: number) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProducts = useCallback(async () => {
    try {
      const data = await api<Product[]>('/products', { auth: false });
      // Backend returns price as a number already, but make sure
      setProducts(data.map((p) => ({ ...p, price: Number(p.price) })));
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  const createProduct = async (input: ProductInput) => {
    const created = await api<Product>('/products', { method: 'POST', body: input });
    const normalized = { ...created, price: Number(created.price) };
    setProducts((prev) => [...prev, normalized]);
    return normalized;
  };

  const updateProduct = async (id: number, input: ProductInput) => {
    const updated = await api<Product>(`/products/${id}`, { method: 'PUT', body: input });
    const normalized = { ...updated, price: Number(updated.price) };
    setProducts((prev) => prev.map((p) => (p.id === id ? normalized : p)));
    return normalized;
  };

  const deleteProduct = async (id: number) => {
    await api(`/products/${id}`, { method: 'DELETE' });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <ProductContext.Provider
      value={{ products, loading, error, refreshProducts, createProduct, updateProduct, deleteProduct }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}
