import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-[#fafaf9] px-4 py-16">
      <div className="text-center max-w-md bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-[#1b5d4e]">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <h1 className="text-4xl font-extrabold text-[#1c2c34] mb-2">404</h1>
        <h2 className="text-xl font-bold text-gray-800 mb-3">Page Not Found</h2>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Discover our wide selection of premium products instead!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            className="rounded-xl border-gray-200 text-gray-700"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Home
          </Button>
          <Button
            className="bg-[#1b5d4e] hover:bg-[#14473b] text-white rounded-xl shadow-sm"
            onClick={() => navigate('/products')}
          >
            Explore Products
          </Button>
        </div>
      </div>
    </div>
  );
}
