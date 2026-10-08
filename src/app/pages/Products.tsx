import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Search, X, ArrowUpDown, RotateCcw } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useProducts } from '../context/ProductContext';

export default function Products() {
  const { products, loading, error } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const searchParam = searchParams.get('search') || '';

  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryParam ? [categoryParam] : []
  );
  const [priceRange, setPriceRange] = useState<number[]>([0, 3000]);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [showFilters, setShowFilters] = useState(false);

  // Sync state if URL query params change
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategories([categoryParam]);
    }
  }, [categoryParam]);

  useEffect(() => {
    setSearchQuery(searchParam);
  }, [searchParam]);

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category))).sort();
  }, [products]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  const pricePresets = [
    { label: 'All Prices', range: [0, 3000] },
    { label: 'Under ₹250', range: [0, 250] },
    { label: '₹250 - ₹500', range: [250, 500] },
    { label: '₹500 - ₹1,000', range: [500, 1000] },
    { label: '₹1,000 - ₹2,000', range: [1000, 2000] },
    { label: 'Above ₹2,000', range: [2000, 3000] },
  ];

  const minActivePrice = Math.min(priceRange[0], priceRange[1]);
  const maxActivePrice = Math.max(priceRange[0], priceRange[1]);

  const filteredProducts = useMemo(() => {
    const cleanSearch = searchQuery.trim().toLowerCase();

    let filtered = products.filter((product) => {
      // Category filter
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(product.category);

      // Price filter (low to high and high to low supported safely)
      const matchesPrice =
        product.price >= minActivePrice && product.price <= maxActivePrice;

      // Search filter
      const matchesSearch =
        !cleanSearch ||
        product.name.toLowerCase().includes(cleanSearch) ||
        product.category.toLowerCase().includes(cleanSearch) ||
        product.description?.toLowerCase().includes(cleanSearch);

      return matchesCategory && matchesPrice && matchesSearch;
    });

    // Sorting
    const sorted = [...filtered];
    switch (sortBy) {
      case 'price-asc':
        // Low to High
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        // High to Low
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }

    return sorted;
  }, [products, selectedCategories, minActivePrice, maxActivePrice, sortBy, searchQuery]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const resetAllFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 3000]);
    setSearchQuery('');
    setSortBy('featured');
    setSearchParams({});
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ search: searchQuery.trim() });
    } else {
      setSearchParams({});
    }
  };

  const isFiltered =
    selectedCategories.length > 0 ||
    minActivePrice > 0 ||
    maxActivePrice < 3000 ||
    searchQuery.trim().length > 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <p className="text-gray-500 font-medium">Loading products...</p>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9] px-4">
        <div className="text-center bg-white border border-red-100 rounded-2xl p-8 max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Could not load products</h2>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Header Banner */}
      <div className="bg-[#FDFBF7] py-10 border-b border-gray-200/80">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl">
            <span className="text-[#1b5d4e] font-semibold text-sm tracking-wider uppercase mb-1 block">
              ShopHub Collection
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#1c2c34] mb-3">
              Explore All Products
            </h1>
            <p className="text-gray-600 text-base md:text-lg">
              Showing {filteredProducts.length} of {products.length} products available for quick delivery
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-8">
        {/* Search Bar & Controls Bar */}
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96 flex items-center">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 py-2.5 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchParams({});
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              {/* Mobile Filter Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden gap-2 rounded-xl text-gray-700 border-gray-200"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters {isFiltered && '(Active)'}
              </Button>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-gray-500 hidden sm:block" />
                <span className="text-sm text-gray-500 hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3.5 py-2.5 border border-gray-200 rounded-xl bg-white text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1b5d4e]/20 cursor-pointer shadow-sm"
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filters Badges */}
          {isFiltered && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100 text-xs">
              <span className="text-gray-500 font-medium">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 rounded-lg bg-gray-100 text-gray-800">
                  Search: "{searchQuery}"
                  <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => setSearchQuery('')} />
                </Badge>
              )}
              {selectedCategories.map((cat) => (
                <Badge key={cat} variant="secondary" className="gap-1.5 py-1 px-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {cat}
                  <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => toggleCategory(cat)} />
                </Badge>
              ))}
              {(minActivePrice > 0 || maxActivePrice < 3000) && (
                <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                  Price: ₹{minActivePrice} - ₹{maxActivePrice}
                  <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => setPriceRange([0, 3000])} />
                </Badge>
              )}
              <button
                onClick={resetAllFilters}
                className="text-xs text-red-600 hover:text-red-700 font-semibold ml-auto flex items-center gap-1 cursor-pointer py-1"
              >
                <RotateCcw className="h-3 w-3" />
                Reset all
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside
            className={`${
              showFilters ? 'block' : 'hidden'
            } lg:block w-full lg:w-72 flex-shrink-0`}
          >
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
                
                {/* Categories Filter */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-base">Categories</h3>
                    {selectedCategories.length > 0 && (
                      <button
                        onClick={() => setSelectedCategories([])}
                        className="text-xs text-gray-500 hover:text-gray-800"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    {categories.map((category) => (
                      <div
                        key={category}
                        className="flex items-center justify-between hover:bg-gray-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                        onClick={() => toggleCategory(category)}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Checkbox
                            id={category}
                            checked={selectedCategories.includes(category)}
                            onCheckedChange={() => toggleCategory(category)}
                          />
                          <Label
                            htmlFor={category}
                            className="cursor-pointer text-sm font-medium text-gray-700 select-none"
                          >
                            {category}
                          </Label>
                        </div>
                        <span className="text-xs text-gray-400 font-medium">
                          {categoryCounts[category] || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 text-base">Price Range</h3>
                    {(minActivePrice > 0 || maxActivePrice < 3000) && (
                      <button
                        onClick={() => setPriceRange([0, 3000])}
                        className="text-xs text-gray-500 hover:text-gray-800"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Dual Slider */}
                  <div className="space-y-4 mb-4">
                    <Slider
                      min={0}
                      max={3000}
                      step={50}
                      value={priceRange}
                      onValueChange={setPriceRange}
                      className="w-full"
                    />

                    {/* Numeric Inputs for Min and Max */}
                    <div className="grid grid-cols-2 gap-3 items-center">
                      <div>
                        <Label className="text-[11px] text-gray-500 mb-1 block">Min Price (₹)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={maxActivePrice}
                          step={50}
                          value={minActivePrice}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            setPriceRange([val, maxActivePrice]);
                          }}
                          className="h-9 text-xs rounded-lg border-gray-200"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-gray-500 mb-1 block">Max Price (₹)</Label>
                        <Input
                          type="number"
                          min={minActivePrice}
                          max={3000}
                          step={50}
                          value={maxActivePrice}
                          onChange={(e) => {
                            const val = Math.min(3000, Number(e.target.value) || 3000);
                            setPriceRange([minActivePrice, val]);
                          }}
                          className="h-9 text-xs rounded-lg border-gray-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Price Range Presets */}
                  <div className="space-y-1.5 pt-2">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Quick Range Presets
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {pricePresets.map((preset) => {
                        const isSelected =
                          priceRange[0] === preset.range[0] &&
                          priceRange[1] === preset.range[1];
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setPriceRange([...preset.range])}
                            className={`text-xs py-1.5 px-2 rounded-lg text-left transition-all ${
                              isSelected
                                ? 'bg-[#1b5d4e] text-white font-medium shadow-xs'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Reset All Button */}
                <div className="pt-6 border-t border-gray-100">
                  <Button
                    variant="outline"
                    className="w-full rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
                    onClick={resetAllFilters}
                  >
                    Reset All Filters
                  </Button>
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <Search className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No matching products found</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    We couldn't find any products matching your current filters and price range. Try clearing your filters or searching for something else.
                  </p>
                  <Button
                    onClick={resetAllFilters}
                    className="bg-[#1b5d4e] hover:bg-[#14473b] text-white rounded-xl px-6"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
