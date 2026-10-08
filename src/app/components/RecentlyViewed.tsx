import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { ImageWithFallback } from './figma/ImageWithFallback';

const KEY = 'shophub_recently_viewed';
const MAX = 8;

const read = (): number[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((n) => typeof n === 'number') : [];
  } catch {
    return [];
  }
};

/** Remembers the products a visitor looked at (in this browser) and shows the others. */
export function RecentlyViewed({ currentId }: { currentId: number }) {
  const navigate = useNavigate();
  const { products } = useProducts();
  const [ids, setIds] = useState<number[]>(read);

  useEffect(() => {
    const next = [currentId, ...read().filter((id) => id !== currentId)].slice(0, MAX);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* private mode: just don't remember */
    }
    setIds(next);
  }, [currentId]);

  // only products that still exist, never the one being viewed
  const shown = ids
    .filter((id) => id !== currentId)
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .slice(0, 4);

  if (shown.length === 0) return null;

  return (
    <div className="mt-16">
      <h2 className="text-3xl font-bold mb-6">Recently Viewed</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {shown.map((p) => (
          <div
            key={p.id}
            className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow bg-white"
            onClick={() => navigate(`/product/${p.id}`)}
          >
            <div className="aspect-square bg-gray-100">
              <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-1 line-clamp-1">{p.name}</h3>
              <p className="text-lg font-bold">₹{p.price.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
