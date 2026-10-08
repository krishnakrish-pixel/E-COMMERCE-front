import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Search, 
  Menu, 
  User, 
  LogOut, 
  Package, 
  UserCircle, 
  ShoppingBag, 
  X, 
  ArrowRight,
  ShieldCheck,
  Truck,
  Heart,
  KeyRound
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';

export function Header() {
  const { getCartCount } = useCart();
  const { wishlist } = useWishlist();
  const { user, isAuthenticated, logout } = useAuth();
  const { products } = useProducts();
  const navigate = useNavigate();
  const cartCount = getCartCount();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchDropdown(false);
      setShowMobileSearch(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const searchResults = searchQuery.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FDFBF7] border-b border-gray-200/60 shadow-xs">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-6 flex-shrink-0">
            <Link to="/" className="flex flex-col group cursor-pointer hover:opacity-90">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-[#1b5d4e] h-8 w-8" strokeWidth={2.3} />
                <span className="text-3xl font-extrabold text-[#1c2c34] tracking-tight">ShopHub</span>
              </div>
              <span className="text-[11px] text-gray-500 font-medium ml-10 -mt-0.5 tracking-wide">
                Shop Smart &bull; Live Better
              </span>
            </Link>
          </div>

          {/* Desktop Search Bar with Live Suggestions Dropdown */}
          <div 
            ref={searchContainerRef} 
            className="hidden md:flex flex-1 max-w-lg mx-4 relative"
          >
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder="Search products, brands, categories..."
                className="w-full pl-10 pr-10 py-2.5 rounded-full border-gray-300 bg-white/80 focus:bg-white text-sm shadow-xs transition-all focus:ring-2 focus:ring-[#1b5d4e]/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchDropdown(false);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>

            {/* Live Search Suggestions Dropdown */}
            {showSearchDropdown && searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in-50 duration-200">
                {searchResults.length > 0 ? (
                  <div>
                    <div className="p-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Matching Products ({searchResults.length})
                    </div>
                    <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                      {searchResults.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => {
                            setShowSearchDropdown(false);
                            navigate(`/product/${product.id}`);
                          }}
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg border border-gray-100 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {product.category}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-[#1b5d4e] flex-shrink-0">
                            ₹{product.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div
                      className="p-3 bg-gray-50 border-t border-gray-100 text-center text-xs font-semibold text-[#1b5d4e] hover:bg-emerald-50 cursor-pointer flex items-center justify-center gap-1 transition-colors"
                      onClick={handleSearchSubmit}
                    >
                      View all results for "{searchQuery}"
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-gray-500">
                    No products found for "{searchQuery}".
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowSearchDropdown(false);
                          navigate('/products');
                        }}
                        className="rounded-lg text-xs"
                      >
                        Browse All Products
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-700 hover:bg-gray-200/50 rounded-full"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Products Direct Link */}
            <Button
              variant="ghost"
              className="hidden lg:flex text-gray-700 hover:text-[#1b5d4e] font-medium text-sm rounded-full px-3"
              onClick={() => navigate('/products')}
            >
              Products
            </Button>

            {/* Track Delivery Link */}
            <Button
              variant="ghost"
              className="hidden md:flex text-gray-700 hover:text-[#1b5d4e] font-medium text-sm rounded-full px-3 gap-1.5 cursor-pointer"
              onClick={() => navigate('/track')}
            >
              <Truck className="h-4 w-4 text-[#1b5d4e]" />
              Track Delivery
            </Button>

            {/* Auth Dropdown / Sign In / Sign Out */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                {/* Admin Portal Button */}
                {user.role === 'admin' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800 gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-xs cursor-pointer"
                    onClick={() => navigate('/admin')}
                  >
                    <ShieldCheck className="h-4 w-4 text-purple-600" />
                    <span className="hidden sm:inline">Admin Portal</span>
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="flex items-center gap-2 text-gray-700 hover:bg-gray-100 rounded-full px-2.5 py-1.5 cursor-pointer"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs ${
                        user.role === 'admin' ? 'bg-purple-700' : 'bg-[#1b5d4e]'
                      }`}>
                        {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="text-sm font-semibold hidden md:inline text-gray-800">
                        {user.firstName}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60 p-2 rounded-2xl shadow-xl border border-gray-100">
                    <div className="px-3 py-2">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-bold text-gray-900 text-sm truncate">{user.firstName} {user.lastName}</p>
                        <Badge className={`text-[10px] uppercase font-bold py-0.5 px-2 border-none ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : 'Customer'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    
                    {user.role === 'admin' && (
                      <DropdownMenuItem onSelect={() => navigate('/admin')} className="cursor-pointer rounded-xl py-2 font-semibold text-purple-700 focus:bg-purple-50">
                        <ShieldCheck className="mr-2 h-4 w-4 text-purple-600" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem onSelect={() => navigate('/track')} className="cursor-pointer rounded-xl py-2 font-medium text-[#1b5d4e] focus:bg-emerald-50">
                      <Truck className="mr-2 h-4 w-4 text-[#1b5d4e]" />
                      Track Delivery Process
                    </DropdownMenuItem>

                    <DropdownMenuItem onSelect={() => navigate('/profile')} className="cursor-pointer rounded-xl py-2">
                      <UserCircle className="mr-2 h-4 w-4 text-gray-500" />
                      My Profile
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onSelect={() => navigate('/profile')} className="cursor-pointer rounded-xl py-2">
                      <KeyRound className="mr-2 h-4 w-4 text-gray-500" />
                      Change Password
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onSelect={() => navigate('/wishlist')} className="cursor-pointer rounded-xl py-2">
                      <Heart className="mr-2 h-4 w-4 text-gray-500" />
                      My Wishlist
                    </DropdownMenuItem>

                    <DropdownMenuItem onSelect={() => navigate('/orders')} className="cursor-pointer rounded-xl py-2">
                      <Package className="mr-2 h-4 w-4 text-gray-500" />
                      My Orders
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onSelect={handleLogout} className="cursor-pointer rounded-xl py-2 text-red-600 font-semibold focus:text-red-600 focus:bg-red-50">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Direct Desktop Sign Out Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="hidden xl:flex text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                className="bg-[#1b5d4e] hover:bg-[#14473b] text-white rounded-full px-5 py-2 font-semibold text-sm shadow-sm gap-2 transition-all cursor-pointer"
                onClick={() => navigate('/login')}
              >
                <User className="h-4 w-4" />
                Sign In
              </Button>
            )}
            
            {/* Wishlist */}
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full text-gray-700 hover:text-rose-600"
              onClick={() => navigate('/wishlist')}
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Button>

            {/* Cart Button */}
            <Button
              variant="default"
              className="relative bg-[#1b5d4e] hover:bg-[#14473b] text-white rounded-full px-4 gap-2 font-medium shadow-sm transition-all"
              onClick={() => navigate('/cart')}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <Badge
                  className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[11px] font-bold bg-amber-400 text-gray-900 hover:bg-amber-400 rounded-full"
                >
                  {cartCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Expandable Search Bar */}
        {showMobileSearch && (
          <div className="pb-4 pt-1 md:hidden animate-in slide-in-from-top-2 duration-200">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-10 py-2.5 rounded-full border-gray-300 bg-white text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 p-0.5"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
