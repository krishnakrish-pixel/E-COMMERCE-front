import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import { ProductProvider } from './context/ProductContext';
import { WishlistProvider } from './context/WishlistContext';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      <ProductProvider>
        <OrderProvider>
          <CartProvider>
            <WishlistProvider>
              <RouterProvider router={router} />
            </WishlistProvider>
          </CartProvider>
        </OrderProvider>
      </ProductProvider>
    </AuthProvider>
  );
}