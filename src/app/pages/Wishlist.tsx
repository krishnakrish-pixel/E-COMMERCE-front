import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ProductCard } from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

export default function Wishlist() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { wishlist, loading } = useWishlist();

  React.useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <div className="bg-white py-8 border-b">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">My Wishlist</h1>
          <p className="text-gray-600">
            {wishlist.length} saved {wishlist.length === 1 ? 'item' : 'items'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <p className="text-gray-500">Loading your wishlist...</p>
        ) : wishlist.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-6">Tap the heart on any product to save it for later.</p>
            <Button onClick={() => navigate('/products')} className="bg-[#1b5d4e] hover:bg-[#14473b] text-white rounded-xl">
              Browse products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlist.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
