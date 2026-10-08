import type { Product } from '../context/CartContext';

/** `stock` is null/undefined for products that are not tracked, those are always available. */
export const isOutOfStock = (p: Pick<Product, 'stock'>) =>
  p.stock !== null && p.stock !== undefined && p.stock <= 0;

export const isLowStock = (p: Pick<Product, 'stock'>) =>
  p.stock !== null && p.stock !== undefined && p.stock > 0 && p.stock <= 5;

/** Largest quantity a customer can put in the cart (stock, capped at 100). */
export const maxQuantity = (p: Pick<Product, 'stock'>) =>
  p.stock === null || p.stock === undefined ? 100 : Math.max(0, Math.min(p.stock, 100));

export const formatMoney = (n: number) =>
  `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
