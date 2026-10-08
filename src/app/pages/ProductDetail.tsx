import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Minus, Plus, ShoppingCart, Share2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { RecentlyViewed } from '../components/RecentlyViewed';
import { toast } from 'sonner';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { WishlistButton } from '../components/WishlistButton';
import { ProductReviews } from '../components/ProductReviews';
import { isOutOfStock, isLowStock, maxQuantity } from '../lib/stock';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { products, loading } = useProducts();
  const [quantity, setQuantity] = useState(1);

  const product = products.find((p) => p.id === Number(id));

  if (!product && loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-gray-500">Loading product...</div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Product not found</h1>
        <Button onClick={() => navigate('/products')}>
          Back to Products
        </Button>
      </div>
    );
  }

  const outOfStock = isOutOfStock(product);
  const maxQty = maxQuantity(product);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Product link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  const handleAddToCart = async () => {
    if (outOfStock) return;
    const ok = await addToCart(product, quantity);
    if (!ok) return;
    toast.success('Added to Cart', {
      description: `${quantity}x ${product.name} added to your cart.`,
      action: {
        label: 'View Cart',
        onClick: () => navigate('/cart'),
      },
    });
  };

  const handleBuyNow = async () => {
    if (outOfStock) return;
    if (!isAuthenticated) {
      toast.info('Please sign in to buy this product');
      navigate('/login');
      return;
    }
    navigate('/checkout', { state: { buyNow: { product, quantity } } });
  };

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <button onClick={() => navigate('/')} className="hover:text-gray-900">
            Home
          </button>
          <span>/</span>
          <button onClick={() => navigate('/products')} className="hover:text-gray-900">
            Products
          </button>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Image */}
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <ImageWithFallback
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <Badge variant="secondary" className="w-fit mb-4 bg-gray-100 text-gray-700">
              {product.category}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-[#1c2c34]">{product.name}</h1>
            
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="font-semibold text-gray-700">({Number(product.rating).toFixed(1)})</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">
                {product.reviewCount ?? 0} customer {product.reviewCount === 1 ? 'review' : 'reviews'}
              </span>
            </div>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-black text-gray-900">₹{product.price.toFixed(2)}</span>
              <span className="text-base text-gray-400 line-through">₹{(product.price * 1.25).toFixed(2)}</span>
              <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold">Save 20%</Badge>
            </div>

            <p className="text-gray-600 mb-8 leading-relaxed">{product.description}</p>

            <Separator className="my-6" />

            {/* Quantity */}
            <div className="mb-6">
              <label className="block font-semibold mb-3 text-sm text-gray-700">Quantity</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-lg h-10 w-10 border-gray-300"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={outOfStock}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-xl font-bold w-12 text-center text-gray-900">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-lg h-10 w-10 border-gray-300"
                  onClick={() => {
                    if (quantity >= maxQty) {
                      toast.error(`Only ${maxQty} available`);
                      return;
                    }
                    setQuantity(quantity + 1);
                  }}
                  disabled={outOfStock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Button
                size="lg"
                className="flex-1 gap-2 bg-[#1b5d4e] hover:bg-[#14473b] text-white rounded-xl py-6 font-semibold shadow-md"
                onClick={handleAddToCart}
                disabled={outOfStock}
              >
                <ShoppingCart className="h-5 w-5" />
                {outOfStock ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 border-[#1b5d4e] text-[#1b5d4e] hover:bg-[#1b5d4e]/10 rounded-xl py-6 font-semibold"
                onClick={handleBuyNow}
                disabled={outOfStock}
              >
                Buy Now
              </Button>
              <WishlistButton product={product} variant="detail" />
              <Button size="lg" variant="outline" className="rounded-xl h-auto py-3 px-4 border-gray-200" onClick={handleShare} aria-label="Copy product link">
                <Share2 className="h-5 w-5 text-gray-600" />
              </Button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold">SKU:</span>
                <span className="text-gray-600">PROD-{product.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Category:</span>
                <span className="text-gray-600">{product.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Availability:</span>
                {outOfStock ? (
                  <span className="text-red-600 font-semibold">Out of stock</span>
                ) : isLowStock(product) ? (
                  <span className="text-amber-600 font-semibold">Only {product.stock} left, order soon</span>
                ) : (
                  <span className="text-green-600">In Stock</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="description" className="mb-16">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger
              value="description"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-black"
            >
              Description
            </TabsTrigger>
            <TabsTrigger
              value="specifications"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-black"
            >
              Specifications
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-black"
            >
              Reviews ({product.reviewCount ?? 0})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-6">
            <div className="prose max-w-none">
              <p>{product.description}</p>
              <p className="mt-4">
                This premium product is carefully crafted with attention to detail and quality.
                It features advanced technology and materials to ensure durability and performance.
              </p>
            </div>
          </TabsContent>
          <TabsContent value="specifications" className="mt-6">
            <div className="space-y-3">
              <div className="flex py-2 border-b">
                <span className="font-semibold w-48">Brand</span>
                <span className="text-gray-600">Premium Brand</span>
              </div>
              <div className="flex py-2 border-b">
                <span className="font-semibold w-48">Category</span>
                <span className="text-gray-600">{product.category}</span>
              </div>
              <div className="flex py-2 border-b">
                <span className="font-semibold w-48">Warranty</span>
                <span className="text-gray-600">1 Year Limited Warranty</span>
              </div>
              <div className="flex py-2 border-b">
                <span className="font-semibold w-48">Shipping</span>
                <span className="text-gray-600">Free shipping on orders over ₹999</span>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="mt-6">
            <ProductReviews product={product} />
          </TabsContent>
        </Tabs>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct.id}
                  className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/product/${relatedProduct.id}`)}
                >
                  <div className="aspect-square bg-gray-100">
                    <ImageWithFallback
                      src={relatedProduct.image}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-1">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-lg font-bold">
                      ₹{relatedProduct.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <RecentlyViewed currentId={product.id} />
      </div>
    </div>
  );
}
