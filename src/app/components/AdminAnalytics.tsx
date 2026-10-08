import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, RotateCcw, Receipt } from 'lucide-react';
import { api } from '../api/client';

interface Stats {
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  customerCount: number;
  productCount: number;
  lowStockCount: number;
  pendingReturns: number;
  ordersByStatus: Record<string, number>;
  revenueByDay: { date: string; revenue: number; orders: number }[];
  topProducts: { productId: number; name: string; units: number; revenue: number }[];
}

const STATUS_COLOURS: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

const inr = (n: number) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

/** Sales charts and key numbers, all calculated by the backend (GET /api/admin/stats). */
export function AdminAnalytics({ refreshKey }: { refreshKey: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api<Stats>('/admin/stats')
      .then((s) => !cancelled && (setStats(s), setError('')))
      .catch((e) => !cancelled && setError(e.message || 'Could not load analytics'));
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!stats) return <p className="text-sm text-gray-500">Loading analytics...</p>;

  const week = (from: number, to: number) =>
    stats.revenueByDay.slice(from, to).reduce((sum, d) => sum + Number(d.revenue), 0);
  const thisWeek = week(7, 14);
  const lastWeek = week(0, 7);
  const change = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : null;

  const chartData = stats.revenueByDay.map((d) => ({
    day: new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    revenue: Number(d.revenue),
    orders: d.orders,
  }));
  const statusData = Object.entries(stats.ordersByStatus).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Last 7 days</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{inr(thisWeek)}</p>
          {change === null ? (
            <p className="text-xs text-gray-400 mt-2">No sales in the week before</p>
          ) : (
            <p className={`text-xs font-medium mt-2 flex items-center gap-1 ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(change).toFixed(1)}% vs previous 7 days
            </p>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1"><Receipt className="h-3 w-3" /> Avg order value</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{inr(stats.averageOrderValue)}</p>
          <p className="text-xs text-gray-400 mt-2">{stats.orderCount} completed sales</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Low stock</p>
          <p className={`text-2xl font-extrabold mt-1 ${stats.lowStockCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{stats.lowStockCount}</p>
          <p className="text-xs text-gray-400 mt-2">products with 5 or fewer left</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1"><RotateCcw className="h-3 w-3" /> Return requests</p>
          <p className={`text-2xl font-extrabold mt-1 ${stats.pendingReturns > 0 ? 'text-purple-700' : 'text-gray-900'}`}>{stats.pendingReturns}</p>
          <p className="text-xs text-gray-400 mt-2">waiting for your decision</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-1">Sales, last 14 days</h3>
          <p className="text-xs text-gray-500 mb-4">Cancelled and refunded orders are not counted</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7e22ce" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#7e22ce" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={1} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} width={40} />
                <Tooltip formatter={(v: number, n: string) => (n === 'revenue' ? [inr(v), 'Revenue'] : [v, 'Orders'])} />
                <Area type="monotone" dataKey="revenue" stroke="#7e22ce" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-4">Orders by status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {statusData.map((d) => (
                    <Cell key={d.name} fill={STATUS_COLOURS[d.name] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4">Best sellers</h3>
        {stats.topProducts.length === 0 ? (
          <p className="text-sm text-gray-500">Sales will show up here once customers start ordering.</p>
        ) : (
          <div className="space-y-3">
            {stats.topProducts.map((p, i) => (
              <div key={p.productId} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <span className="flex-1 text-sm font-medium text-gray-900 truncate">{p.name}</span>
                <span className="text-xs text-gray-500">{p.units} sold</span>
                <span className="text-sm font-bold text-gray-900 w-24 text-right">{inr(p.revenue)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
