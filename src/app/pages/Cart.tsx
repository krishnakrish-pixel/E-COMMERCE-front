import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { useCart } from '../context/CartContext';
import { maxQuantity } from '../lib/stock';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export default function Cart() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, getCartTotal } = useCart();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">
            Add some products to get started!
          </p>
          <Button onClick={() => navigate('/products')}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="bg-gray-50 py-8 border-b">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Shopping Cart</h1>
          <p className="text-gray-600">{cart.length} items in your cart</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <div
                      className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                      onClick={() => navigate(`/product/${item.id}`)}
                    >
                      <ImageWithFallback
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3
                            className="font-semibold text-lg cursor-pointer hover:text-blue-600"
                            onClick={() => navigate(`/product/${item.id}`)}
                          >
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {item.category}
                          </p>
                          {item.stock !== null && item.stock !== undefined && item.stock <= 5 && (
                            <p className="text-xs font-semibold text-amber-600 mt-1">
                              {item.stock <= 0 ? 'Out of stock, remove it to check out' : `Only ${item.stock} left in stock`}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-lg font-semibold w-12 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            disabled={item.quantity >= maxQuantity(item)}
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">
                            ₹{item.price.toFixed(2)} each
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 rounded-2xl shadow-sm border border-gray-100">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold text-gray-900">
                      ₹{getCartTotal().toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold text-gray-900">
                      {getCartTotal() >= 999 ? (
                        <span className="text-emerald-600 font-bold">Free</span>
                      ) : (
                        '₹99.00'
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (10%)</span>
                    <span className="font-semibold text-gray-900">
                      ₹{(getCartTotal() * 0.1).toFixed(2)}
                    </span>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="flex justify-between items-baseline mb-6">
                  <span className="text-xl font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-extrabold text-[#1b5d4e]">
                    ₹
                    {(
                      getCartTotal() +
                      (getCartTotal() >= 999 ? 0 : 99) +
                      getCartTotal() * 0.1
                    ).toFixed(2)}
                  </span>
                </div>

                <Button
                  className="w-full mb-3 bg-[#1b5d4e] hover:bg-[#14473b] text-white rounded-xl py-6 font-semibold shadow-md"
                  size="lg"
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to Checkout
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 py-5"
                  onClick={() => navigate('/products')}
                >
                  Continue Shopping
                </Button>

                {getCartTotal() < 999 && (
                  <p className="text-xs text-center text-gray-500 mt-4 bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-100">
                    Add ₹{(999 - getCartTotal()).toFixed(2)} more for free shipping!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
