import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  HeadphonesIcon
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { ProductCard } from '../components/ProductCard';
import { useProducts } from '../context/ProductContext';

export default function Home() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const featuredProducts = products.slice(0, 8);

  const categories = [
    { name: 'Mobiles', sub: 'Stay Connected', img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=300&auto=format&fit=crop', bg: 'bg-indigo-50' },
    { name: 'Laptops', sub: 'Work Smarter', img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=300&auto=format&fit=crop', bg: 'bg-blue-50' },
    { name: 'Accessories', sub: 'For Your Style', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=300&auto=format&fit=crop', bg: 'bg-rose-50' },
    { name: 'Fashion', sub: 'Express Yourself', img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=300&auto=format&fit=crop', bg: 'bg-emerald-50' },
    { name: 'Home & Living', sub: 'Make It Yours', img: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?q=80&w=300&auto=format&fit=crop', bg: 'bg-orange-50' },
    { name: 'Beauty', sub: 'Feel Beautiful', img: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=300&auto=format&fit=crop', bg: 'bg-pink-50' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Hero Section */}
      <section className="relative pt-6 pb-16 overflow-hidden">
        <div className="container mx-auto px-4 md:px-8 relative z-10 flex flex-col xl:flex-row items-center">
          
          <div className="w-full xl:w-[45%] pt-2 relative z-10">
            <h1 className="text-6xl md:text-[5.5rem] font-extrabold text-[#1c2c34] mt-8 mb-6 leading-[1.05] tracking-tight">
              Discover <br />
              <span className="relative inline-block text-[#1b5d4e]">
                Premium
                <div className="absolute -bottom-2 left-0 w-full h-4 bg-[#b5d3af] opacity-50 -z-10 rounded-full transform -rotate-1"></div>
              </span> <br />
              Products
            </h1>
            
            <div className="text-gray-600 mb-2 flex flex-wrap items-center text-base md:text-lg font-medium">
              <span>Top brands</span>
              <span className="mx-3 text-gray-300">|</span>
              <span>Best quality</span>
              <span className="mx-3 text-gray-300">|</span>
              <span>Great prices</span>
            </div>
            <p className="text-gray-500 mb-10 text-base">Everything you need, all in one place.</p>
            
            <Button 
              onClick={() => navigate('/products')}
              className="bg-[#1b5d4e] hover:bg-[#14473b] text-white rounded-full px-8 py-7 text-lg font-medium shadow-xl transition-all"
            >
              Shop Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="w-full xl:w-[55%] mt-16 xl:mt-0 relative flex justify-center xl:justify-end">
             {/* Main Image */}
             <div className="relative w-full max-w-2xl">
               <img 
                 src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=1200" 
                 alt="Premium Products Showcase" 
                 className="rounded-3xl shadow-lg object-cover w-full h-auto"
               />
               
               {/* Decorative Text floating */}
               <div className="absolute -top-12 -left-12 rotate-[-10deg] font-handwriting text-3xl text-[#1c2c34] hidden md:block leading-tight font-light">
                 Better<br/>Choices<br/>Brighter<br/>Days ♡
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-white rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.02)] border-b border-gray-100 z-20 relative">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, idx) => (
              <div 
                key={idx} 
                onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}
                className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm hover:shadow-md cursor-pointer transition-all group flex flex-col"
              >
                <div className={`w-full aspect-square rounded-xl ${cat.bg} overflow-hidden mb-4 relative`}>
                  <img src={cat.img} alt={cat.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 mix-blend-multiply" />
                </div>
                <div className="flex justify-between items-end px-1">
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900">{cat.name}</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">{cat.sub}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#1b5d4e] transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Banner */}
      <section className="py-8 bg-[#F4F8F5]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-gray-200/60">
            <div className="flex items-center gap-4 px-4 w-full md:w-1/3 justify-center md:justify-start pt-4 md:pt-0">
              <Truck className="h-8 w-8 text-[#1b5d4e]" strokeWidth={1.5} />
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Free Shipping</h3>
                <p className="text-xs text-gray-600">On orders above ₹999</p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-4 w-full md:w-1/3 justify-center pt-4 md:pt-0">
              <ShieldCheck className="h-8 w-8 text-[#1b5d4e]" strokeWidth={1.5} />
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Secure Payments</h3>
                <p className="text-xs text-gray-600">100% Safe & Trusted</p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-4 w-full md:w-1/3 justify-center md:justify-end pt-4 md:pt-0">
              <HeadphonesIcon className="h-8 w-8 text-[#1b5d4e]" strokeWidth={1.5} />
              <div>
                <h3 className="font-bold text-gray-900 text-sm">24/7 Support</h3>
                <p className="text-xs text-gray-600">We're here to help</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-extrabold mb-2 text-gray-900">Featured Products</h2>
              <p className="text-gray-500">Discover our handpicked selection</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/products')}
              className="gap-2 rounded-full border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
