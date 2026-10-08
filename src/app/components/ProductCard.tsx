import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Card, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Product } from '../context/CartContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { WishlistButton } from './WishlistButton';
import { isOutOfStock, isLowStock } from '../lib/stock';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [isAdded, setIsAdded] = React.useState(false);

  const outOfStock = isOutOfStock(product);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (outOfStock) return;
    const ok = await addToCart(product, 1);
    if (!ok) return;            // the cart already showed why (e.g. not enough stock)
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);

    toast.success('Added to Cart', {
      description: `${product.name} has been added to your cart.`,
      action: {
        label: 'View Cart',
        onClick: () => navigate('/cart'),
      },
    });
  };

  // Buy Now: check out just this product (the rest of the cart is left alone)
  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (outOfStock) return;
    if (!isAuthenticated) {
      toast.info('Please sign in to buy this product');
      navigate('/login');
      return;
    }
    navigate('/checkout', { state: { buyNow: { product, quantity: 1 } } });
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100 flex flex-col h-full bg-white rounded-2xl"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="aspect-square overflow-hidden bg-gray-50 relative">
        <ImageWithFallback
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${outOfStock ? 'opacity-50 grayscale' : ''}`}
        />
        <WishlistButton product={product} />
        {outOfStock && (
          <Badge className="absolute bottom-3 left-3 bg-gray-900 text-white border-none">Out of stock</Badge>
        )}
        {isLowStock(product) && (
          <Badge className="absolute bottom-3 left-3 bg-amber-500 text-white border-none">Only {product.stock} left</Badge>
        )}
        <Badge 
          variant="secondary" 
          className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-700 shadow-sm border border-gray-200/50"
        >
          {product.category}
        </Badge>
      </div>
      <CardContent className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-gray-900 mb-1.5 line-clamp-1 group-hover:text-[#1b5d4e] transition-colors">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">
          {product.description}
        </p>
        <div className="flex items-center gap-1 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${
                i < Math.floor(product.rating)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-gray-200'
              }`}
            />
          ))}
          <span className="text-xs font-medium text-gray-600 ml-1">
            {Number(product.rating).toFixed(1)}
            {!!product.reviewCount && <span className="text-gray-400"> ({product.reviewCount})</span>}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-extrabold text-gray-900">₹{product.price.toFixed(2)}</span>
          <span className="text-xs text-gray-400 line-through">₹{(product.price * 1.2).toFixed(2)}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button 
          className={`flex-1 transition-all duration-200 rounded-xl font-medium ${
            isAdded 
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
              : 'bg-[#1b5d4e] hover:bg-[#14473b] text-white shadow-sm'
          }`}
          onClick={handleAddToCart}
          disabled={outOfStock}
        >
          {outOfStock ? 'Out of Stock' : isAdded ? 'Added ✓' : 'Add to Cart'}
        </Button>
        {!outOfStock && (
          <Button
            variant="outline"
            className="flex-1 rounded-xl font-semibold border-[#1b5d4e] text-[#1b5d4e] hover:bg-[#1b5d4e]/10"
            onClick={handleBuyNow}
          >
            Buy Now
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
