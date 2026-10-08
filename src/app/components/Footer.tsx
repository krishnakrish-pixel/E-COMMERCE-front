import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white text-xl font-bold mb-4">ShopHub</h3>
            <p className="text-sm">
              Your one-stop destination for premium products and exceptional shopping experience.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/products" className="hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/products?category=Electronics" className="hover:text-white transition-colors">
                  Electronics
                </Link>
              </li>
              <li>
                <Link to="/products?category=Accessories" className="hover:text-white transition-colors">
                  Accessories
                </Link>
              </li>
              <li>
                <Link to="/products?category=Bags" className="hover:text-white transition-colors">
                  Bags
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-white transition-colors font-medium text-emerald-400">
                  Track Delivery Process
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white transition-colors">
                  My Orders & Shipments
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-white transition-colors">
                  Shipping & Free Delivery (Above ₹999)
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-white transition-colors">
                  Returns & Replacements
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Follow Us</h4>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>&copy; 2026 ShopHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
