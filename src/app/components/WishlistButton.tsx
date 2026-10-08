import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { useWishlist } from '../context/WishlistContext';
import type { Product } from '../context/CartContext';

interface Props {
  product: Product;
  /** 'card' = small round button over an image, 'detail' = large outlined button */
  variant?: 'card' | 'detail';
}

export function WishlistButton({ product, variant = 'card' }: Props) {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const saved = isInWishlist(product.id);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await toggleWishlist(product);
    if (result === 'login') {
      toast.info('Sign in to save items to your wishlist', {
        action: { label: 'Sign in', onClick: () => navigate('/login') },
      });
    } else if (result === 'added') {
      toast.success('Saved to wishlist', {
        action: { label: 'View', onClick: () => navigate('/wishlist') },
      });
    } else if (result === 'removed') {
      toast('Removed from wishlist');
    }
  };

  const heart = (
    <Heart className={`h-5 w-5 ${saved ? 'fill-rose-500 text-rose-500' : 'text-gray-600'}`} />
  );

  if (variant === 'detail') {
    return (
      <Button
        size="lg"
        variant="outline"
        className="rounded-xl h-auto py-3 px-4 border-gray-200"
        onClick={handleClick}
        aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        {heart}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
      className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm shadow-sm border border-gray-200/50 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
    >
      {heart}
    </button>
  );
}
