import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Trash2, BadgeCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { useProducts } from '../context/ProductContext';
import type { Product } from '../context/CartContext';

interface Review {
  id: string;
  productId: number;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

function Stars({ value, size = 'h-4 w-4' }: { value: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${size} ${i < Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
}

export function ProductReviews({ product }: { product: Product }) {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { orders } = useOrders();
  const { refreshProducts } = useProducts();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setReviews(await api<Review[]>(`/products/${product.id}/reviews`, { auth: false }));
    } catch {
      /* leave the list empty */
    } finally {
      setLoading(false);
    }
  }, [product.id]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const mine = user ? reviews.find((r) => r.userId === user.id) : undefined;

  // Same rule the server enforces: a non-cancelled order containing this product
  const hasPurchased =
    !!user &&
    orders.some(
      (o) =>
        o.userId === user.id &&
        o.status !== 'cancelled' &&
        o.items.some((i) => i.id === product.id)
    );

  useEffect(() => {
    if (mine) {
      setRating(mine.rating);
      setComment(mine.comment || '');
    }
  }, [mine?.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api('/reviews', { method: 'POST', body: { productId: product.id, rating, comment } });
      toast.success(mine ? 'Review updated' : 'Thanks for your review!');
      await Promise.all([load(), refreshProducts()]);
    } catch (err: any) {
      toast.error(err.message || 'Could not save your review');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api(`/reviews/${id}`, { method: 'DELETE' });
      toast.success('Review deleted');
      if (mine && mine.id === id) {
        setRating(5);
        setComment('');
      }
      await Promise.all([load(), refreshProducts()]);
    } catch (err: any) {
      toast.error(err.message || 'Could not delete the review');
    }
  };

  const counts = [5, 4, 3, 2, 1].map((n) => reviews.filter((r) => r.rating === n).length);
  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="flex flex-col sm:flex-row gap-8 items-start">
        <div className="text-center sm:text-left">
          <div className="text-5xl font-black text-gray-900">
            {reviews.length ? average.toFixed(1) : '–'}
          </div>
          <Stars value={average} size="h-5 w-5" />
          <p className="text-sm text-gray-500 mt-1">
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </p>
        </div>
        <div className="flex-1 w-full max-w-sm space-y-1.5">
          {[5, 4, 3, 2, 1].map((n, idx) => (
            <div key={n} className="flex items-center gap-2 text-xs text-gray-600">
              <span className="w-3">{n}</span>
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400"
                  style={{ width: reviews.length ? `${(counts[idx] / reviews.length) * 100}%` : '0%' }}
                />
              </div>
              <span className="w-5 text-right">{counts[idx]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Write a review */}
      <div className="border rounded-2xl p-5 bg-gray-50/60">
        {!user ? (
          <p className="text-sm text-gray-600">
            <button className="font-semibold text-[#1b5d4e] underline cursor-pointer" onClick={() => navigate('/login')}>
              Sign in
            </button>{' '}
            to review products you have bought.
          </p>
        ) : !hasPurchased ? (
          <p className="text-sm text-gray-600">Only customers who have bought this product can review it.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <p className="font-semibold text-gray-900 text-sm">
              {mine ? 'Update your review' : 'Write a review'}
            </p>
            <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  onMouseEnter={() => setHover(n)}
                  onClick={() => setRating(n)}
                  className="cursor-pointer"
                >
                  <Star
                    className={`h-7 w-7 ${n <= (hover || rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
              placeholder="What did you like or dislike? (optional)"
              className="bg-white"
            />
            <Button type="submit" disabled={saving} className="bg-[#1b5d4e] hover:bg-[#14473b] text-white rounded-xl">
              {saving ? 'Saving...' : mine ? 'Update review' : 'Submit review'}
            </Button>
          </form>
        )}
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-500">No reviews yet. Be the first to share your experience.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border rounded-2xl p-5 bg-white">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-[#1b5d4e]/10 text-[#1b5d4e] rounded-full h-10 w-10 flex items-center justify-center font-bold">
                    {r.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                      {r.userName}
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-700">
                        <BadgeCheck className="h-3.5 w-3.5" /> Verified purchase
                      </span>
                    </p>
                    <div className="flex items-center gap-2">
                      <Stars value={r.rating} />
                      <span className="text-xs text-gray-400">
                        {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
                {(isAdmin || (user && r.userId === user.id)) && (
                  <Button variant="ghost" size="icon" onClick={() => remove(r.id)} aria-label="Delete review">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
              {r.comment && <p className="text-gray-600 mt-3 whitespace-pre-line">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
