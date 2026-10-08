import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Package, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  Plus, 
  Trash2, 
  ArrowUpRight, 
  RefreshCw,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  LogOut,
  Pencil,
  Tag
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { useProducts } from '../context/ProductContext';
import { api } from '../api/client';
import { AdminCoupons } from '../components/AdminCoupons';
import { AdminAnalytics } from '../components/AdminAnalytics';
import { isOutOfStock, isLowStock } from '../lib/stock';
import type { User } from '../context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { orders, updateOrderStatus, decideReturn } = useOrders();
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'customers' | 'coupons'>('overview');
  const { products: productList, createProduct, updateProduct, deleteProduct } = useProducts();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);

  // New product form modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: 'Electronics',
    description: '',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop',
    stock: '50',
  });

  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  // Access check
  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') {
      toast.error('Admin authentication required');
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  // Load registered customers from the database
  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') return;
    api<User[]>('/users')
      .then((all) => setRegisteredUsers(all.filter((u) => u.role !== 'admin')))
      .catch((e) => toast.error(e.message || 'Could not load customers'));
  }, [isAuthenticated, user]);

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return null;
  }

  const emptyProduct = {
    name: '',
    price: '',
    category: 'Electronics',
    description: '',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop',
    stock: '50',
  };

  const openAdd = () => {
    setEditingId(null);
    setNewProduct(emptyProduct);
    setShowAddModal(true);
  };

  const openEdit = (p: (typeof productList)[number]) => {
    setEditingId(p.id);
    setNewProduct({
      name: p.name,
      price: String(p.price),
      category: p.category,
      description: p.description || '',
      image: p.image || '',
      stock: String(p.stock ?? 0),
    });
    setShowAddModal(true);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      toast.error('Please enter product name and price');
      return;
    }

    const price = parseFloat(newProduct.price);
    if (!price || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    const stock = newProduct.stock === '' ? undefined : Math.max(0, Math.floor(Number(newProduct.stock)));
    if (stock !== undefined && Number.isNaN(stock)) {
      toast.error('Please enter a valid stock quantity');
      return;
    }

    const payload = {
      name: newProduct.name,
      price,
      category: newProduct.category,
      description: newProduct.description,
      image: newProduct.image,
      stock,
    };

    try {
      if (editingId !== null) {
        // rating is not sent: it is calculated from customer reviews
        const updated = await updateProduct(editingId, payload);
        toast.success('Product Updated', { description: `${updated.name} has been saved.` });
      } else {
        const created = await createProduct({ ...payload, rating: 5.0 });
        toast.success('Product Added Successfully', {
          description: `${created.name} is now listed in the store.`,
        });
      }
    } catch (err: any) {
      toast.error(editingId !== null ? 'Could not update product' : 'Could not add product', { description: err.message });
      return;
    }

    setNewProduct(emptyProduct);
    setEditingId(null);
    setShowAddModal(false);
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    try {
      await deleteProduct(id);
    } catch (err: any) {
      toast.error('Could not delete product', { description: err.message });
      return;
    }
    toast.success('Product Removed', {
      description: `${name} has been deleted.`,
    });
  };

  // Metrics
  // cancelled orders are not revenue
  // cancelled and refunded (approved return) orders are not revenue
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled' && o.returnStatus !== 'approved')
    .reduce((sum, o) => sum + o.total, 0);
  const totalOrdersCount = orders.length;

  const filteredProducts = productList.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  const q = orderSearch.trim().toLowerCase();
  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      orderStatusFilter === 'all' ||
      (orderStatusFilter === 'return' ? o.returnStatus === 'requested' : o.status === orderStatusFilter);
    const matchesText =
      !q ||
      o.orderNumber.includes(q) ||
      `${o.shippingAddress.firstName} ${o.shippingAddress.lastName}`.toLowerCase().includes(q) ||
      o.shippingAddress.city.toLowerCase().includes(q) ||
      (o.trackingNumber || '').toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q);
    return matchesStatus && matchesText;
  });

  // Download the orders currently shown as a CSV file (opens in Excel / Google Sheets)
  const exportOrdersCsv = () => {
    const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['Order #', 'Date', 'Customer', 'City', 'Items', 'Subtotal', 'Discount', 'Shipping', 'Tax', 'Total', 'Status', 'Payment', 'Coupon', 'Return'];
    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      format(new Date(o.createdAt), 'yyyy-MM-dd HH:mm'),
      `${o.shippingAddress.firstName} ${o.shippingAddress.lastName}`.trim(),
      o.shippingAddress.city,
      o.items.map((i) => `${i.name} x${i.quantity}`).join('; '),
      o.subtotal.toFixed(2),
      (o.discount ?? 0).toFixed(2),
      o.shipping.toFixed(2),
      o.tax.toFixed(2),
      o.total.toFixed(2),
      o.status,
      o.paymentMethod || 'card',
      o.couponCode || '',
      o.returnStatus || '',
    ]);
    const csv = '\uFEFF' + [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `shophub-orders-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} ${rows.length === 1 ? 'order' : 'orders'}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 border-none">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 border-none">Processing</Badge>;
      case 'shipped':
        return <Badge className="bg-purple-100 text-purple-800 border-none">Shipped</Badge>;
      case 'delivered':
        return <Badge className="bg-emerald-100 text-emerald-800 border-none">Delivered</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-none">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-none">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] py-8">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        
        {/* Top Admin Header */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-3xl p-6 md:p-8 mb-8 shadow-md">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-purple-500/30 text-purple-200 border border-purple-400/40 px-3 py-1 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                  Admin Console
                </Badge>
                <span className="text-purple-300 text-xs font-mono">v2.4.0</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                ShopHub Administration
              </h1>
              <p className="text-purple-200 text-sm mt-1">
                Logged in as <span className="font-bold text-white">{user.email}</span> (Super Admin)
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl text-xs font-semibold gap-1.5 cursor-pointer"
                onClick={() => navigate('/products')}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Live Storefront
              </Button>
              <Button
                variant="outline"
                className="bg-red-500/20 hover:bg-red-500/30 text-red-100 border-red-400/30 rounded-xl text-xs font-semibold gap-1.5 cursor-pointer"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1.5 bg-white border border-gray-100 rounded-2xl shadow-xs mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Dashboard Overview
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'products'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Product Catalog
            <Badge className="bg-gray-200 text-gray-800 text-[10px] px-1.5 py-0 border-none">
              {productList.length}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Order Management
            <Badge className="bg-gray-200 text-gray-800 text-[10px] px-1.5 py-0 border-none">
              {orders.length}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Registered Customers
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'coupons'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Tag className="h-3.5 w-3.5" />
            Coupons
          </button>
        </div>

        {/* COUPONS TAB */}
        {activeTab === 'coupons' && <AdminCoupons />}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <Card className="rounded-2xl border-gray-100 shadow-xs bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross Revenue</p>
                      <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-1">₹{totalRevenue.toFixed(2)}</h3>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 font-bold text-xl">
                      ₹
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-3">
                    Excludes cancelled and refunded orders
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-gray-100 shadow-xs bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Orders</p>
                      <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-1">{totalOrdersCount}</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                      <ShoppingBag className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 font-medium mt-3">
                    {orders.filter(o => o.status === 'delivered').length} orders successfully delivered
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-gray-100 shadow-xs bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Store Products</p>
                      <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-1">{productList.length}</h3>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                      <Package className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="text-xs text-purple-600 font-medium mt-3">
                    Across {new Set(productList.map(p => p.category)).size} categories
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-gray-100 shadow-xs bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Customers</p>
                      <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-1">
                        {Math.max(1, registeredUsers.length)}
                      </h3>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="text-xs text-amber-600 font-medium mt-3">100% verified shopper accounts</p>
                </CardContent>
              </Card>
            </div>

            {/* Sales analytics (live from the backend) */}
            <AdminAnalytics refreshKey={orders.map((o) => o.id + o.status + (o.returnStatus || '')).join('|')} />

            {/* Quick Actions & Recent Orders Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-lg">Recent Orders</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-purple-700 font-bold"
                    onClick={() => setActiveTab('orders')}
                  >
                    View All Orders →
                  </Button>
                </div>

                {orders.length === 0 ? (
                  <p className="text-sm text-gray-500 py-8 text-center">No orders have been placed yet.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-sm text-gray-900">Order #{order.orderNumber}</p>
                          <p className="text-xs text-gray-500">
                            {order.shippingAddress.firstName} {order.shippingAddress.lastName} &bull; {order.items.length} items
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm text-gray-900">₹{order.total.toFixed(2)}</span>
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Admin Actions Box */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">Administrator Tools</h3>
                  <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                    Quickly add inventory, update customer shipping statuses, or preview user storefront.
                  </p>
                  <div className="space-y-3">
                    <Button
                      className="w-full bg-purple-700 hover:bg-purple-800 text-white rounded-xl py-5 font-semibold text-xs justify-start gap-2 shadow-xs cursor-pointer"
                      onClick={() => {
                        setActiveTab('products');
                        setShowAddModal(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Add New Product to Store
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full rounded-xl py-5 font-semibold text-xs justify-start gap-2 border-gray-200 cursor-pointer"
                      onClick={() => setActiveTab('orders')}
                    >
                      <Truck className="h-4 w-4 text-purple-700" />
                      Manage Order Shipments
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full rounded-xl py-5 font-semibold text-xs justify-start gap-2 border-gray-200 cursor-pointer"
                      onClick={() => navigate('/products')}
                    >
                      <ExternalLink className="h-4 w-4 text-emerald-700" />
                      Preview Customer Storefront
                    </Button>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Store database synchronized & healthy
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS MANAGEMENT TAB */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Manage Store Products</h2>
                <p className="text-xs text-gray-500">View, add, edit, or delete items currently listed in the store</p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9 h-10 text-xs rounded-xl border-gray-200"
                  />
                </div>
                <Button
                  className="bg-purple-700 hover:bg-purple-800 text-white rounded-xl gap-1.5 text-xs font-semibold h-10 cursor-pointer"
                  onClick={openAdd}
                >
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              </div>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider bg-gray-50/50">
                    <th className="py-3 px-4 rounded-l-xl">Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-11 h-11 rounded-lg object-cover border border-gray-100"
                          />
                          <div>
                            <p className="font-bold text-gray-900 text-sm line-clamp-1">{p.name}</p>
                            <p className="text-xs text-gray-400">ID: #{p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-xs">
                          {p.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">
                        ₹{p.price.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        {isOutOfStock(p) ? (
                          <Badge className="bg-red-100 text-red-700 border-none">Out of stock</Badge>
                        ) : isLowStock(p) ? (
                          <Badge className="bg-amber-100 text-amber-800 border-none">{p.stock} left</Badge>
                        ) : (
                          <span className="text-xs font-semibold text-gray-700">{p.stock ?? '–'}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-amber-600">
                        ★ {Number(p.rating).toFixed(1)}{!!p.reviewCount && <span className="text-gray-400 font-normal"> ({p.reviewCount})</span>}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(p)}
                          className="text-gray-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg cursor-pointer"
                          title="Edit Product"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ORDERS MANAGEMENT TAB */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Customer Orders</h2>
                <p className="text-xs text-gray-500">Update order fulfillment status and view shipping details</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder="Search order #, customer, city, tracking..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="pl-9 h-10 text-xs rounded-xl border-gray-200"
                  />
                </div>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="h-10 rounded-xl border border-gray-200 px-3 text-xs bg-white"
                  aria-label="Filter by status"
                >
                  <option value="all">All orders</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="return">Return requests</option>
                </select>
                <Button
                  variant="outline"
                  onClick={exportOrdersCsv}
                  disabled={filteredOrders.length === 0}
                  className="h-10 rounded-xl text-xs font-semibold border-gray-200 cursor-pointer"
                >
                  Export CSV
                </Button>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-bold">No orders found</p>
                <p className="text-xs text-gray-400 mt-1">Orders placed by customers will appear here in real-time.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider bg-gray-50/50">
                      <th className="py-3 px-4 rounded-l-xl">Order #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Items</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Fulfillment Status</th>
                      <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-gray-900">
                          #{order.orderNumber}
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-semibold text-gray-900 text-sm">
                            {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                          </p>
                          <p className="text-xs text-gray-400 truncate max-w-[150px]">
                            {order.shippingAddress.city}, {order.shippingAddress.country}
                          </p>
                        </td>
                        <td className="py-4 px-4 text-xs text-gray-500 whitespace-nowrap">
                          {format(new Date(order.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="py-4 px-4 text-xs font-semibold text-gray-700">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                        </td>
                        <td className="py-4 px-4 font-extrabold text-gray-900">
                          ₹{order.total.toFixed(2)}
                        </td>
                        <td className="py-4 px-4">
                          <Select
                            disabled={order.status === 'delivered' || order.status === 'cancelled'}
                            value={order.status}
                            onValueChange={async (val: any) => {
                              const ok = await updateOrderStatus(order.id, val);
                              if (ok) toast.success(`Order #${order.orderNumber} updated to ${val}`);
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs font-semibold rounded-lg w-32 border-gray-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {(['pending', 'processing', 'shipped', 'delivered'] as const).map((st) => (
                                <SelectItem
                                  key={st}
                                  value={st}
                                  disabled={['pending', 'processing', 'shipped', 'delivered'].indexOf(st) < ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status)}
                                >
                                  {st.charAt(0).toUpperCase() + st.slice(1)}
                                </SelectItem>
                              ))}
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          {order.returnStatus === 'requested' && (
                            <div className="mb-2 text-left">
                              <Badge className="bg-purple-100 text-purple-800 border-none">Return requested</Badge>
                              {order.returnReason && <p className="text-[11px] text-gray-500 mt-1 max-w-[180px] whitespace-normal">"{order.returnReason}"</p>}
                              <div className="flex gap-1 mt-1.5">
                                <Button size="sm" className="h-7 rounded-lg text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                  onClick={async () => { if (await decideReturn(order.id, 'approve')) toast.success(`Return approved for #${order.orderNumber}, stock restored`); }}>
                                  Approve
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 rounded-lg text-[11px] text-red-600 border-red-200 cursor-pointer"
                                  onClick={async () => { if (await decideReturn(order.id, 'reject')) toast.success(`Return declined for #${order.orderNumber}`); }}>
                                  Decline
                                </Button>
                              </div>
                            </div>
                          )}
                          {order.returnStatus === 'approved' && <Badge className="bg-emerald-100 text-emerald-800 border-none mb-2">Refunded</Badge>}
                          {order.returnStatus === 'rejected' && <Badge className="bg-gray-100 text-gray-600 border-none mb-2">Return declined</Badge>}
                          <div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg text-xs border-gray-200 cursor-pointer"
                            onClick={() => navigate(`/order/${order.id}`)}
                          >
                            View
                          </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Registered Accounts</h2>
            <p className="text-xs text-gray-500 mb-6">Customer accounts registered in the ShopHub database</p>

            <div className="divide-y divide-gray-100">
              {/* Default Admin */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold text-sm">
                    A
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">Administrator Manager</p>
                    <p className="text-xs text-gray-500">admin@shophub.com</p>
                  </div>
                </div>
                <Badge className="bg-purple-100 text-purple-800 border-none font-bold text-xs">
                  System Admin
                </Badge>
              </div>

              {/* Registered Customers */}
              {registeredUsers.map((u: any, idx: number) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1b5d4e] text-white flex items-center justify-center font-bold text-sm">
                      {u.firstName ? u.firstName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-xs">
                    Customer
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADD PRODUCT MODAL */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in-50 duration-200">
              <h3 className="text-xl font-bold text-gray-900 mb-1">{editingId !== null ? 'Edit Product' : 'Add New Product'}</h3>
              <p className="text-xs text-gray-500 mb-6">
                {editingId !== null ? 'Update the details, price or stock of this product' : 'List a new product item in the ShopHub catalog'}
              </p>

              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Product Name</Label>
                  <Input
                    required
                    placeholder="e.g. Wireless Smart Speaker"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="mt-1 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-gray-700">Price (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 499.00"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      className="mt-1 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-gray-700">Category</Label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="w-full mt-1 h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white"
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Mobiles">Mobiles</option>
                      <option value="Laptops">Laptops</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Home & Living">Home & Living</option>
                      <option value="Beauty">Beauty</option>
                      <option value="Bags">Bags</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-700">Stock quantity</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="mt-1 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-700">Image URL</Label>
                  <Input
                    placeholder="https://images.unsplash.com/..."
                    value={newProduct.image}
                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                    className="mt-1 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-700">Description</Label>
                  <Input
                    placeholder="Short product overview..."
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="mt-1 rounded-xl text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 rounded-xl cursor-pointer"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold cursor-pointer"
                  >
                    {editingId !== null ? 'Save Changes' : 'Add Product'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
