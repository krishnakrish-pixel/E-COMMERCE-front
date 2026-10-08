import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { api } from '../api/client';

interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  minOrderAmount: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
}

const emptyForm = {
  code: '',
  description: '',
  discountType: 'PERCENT' as 'PERCENT' | 'FIXED',
  discountValue: '',
  minOrderAmount: '',
  maxUses: '',
  expiresAt: '',
};

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const list = await api<Coupon[]>('/coupons');
      setCoupons(list.map((c) => ({ ...c, discountValue: Number(c.discountValue), minOrderAmount: Number(c.minOrderAmount) })));
    } catch (e: any) {
      toast.error(e.message || 'Could not load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api('/coupons', {
        method: 'POST',
        body: {
          code: form.code.trim(),
          description: form.description.trim(),
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
          maxUses: form.maxUses ? Number(form.maxUses) : null,
          // valid until the END of the chosen day
          expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null,
          active: true,
        },
      });
      toast.success(`Coupon ${form.code.toUpperCase()} created`);
      setForm(emptyForm);
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Could not create the coupon');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (c: Coupon) => {
    try {
      await api(`/coupons/${c.id}/active`, { method: 'PUT', body: { active: !c.active } });
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Could not update the coupon');
    }
  };

  const remove = async (c: Coupon) => {
    try {
      await api(`/coupons/${c.id}`, { method: 'DELETE' });
      toast.success(`Coupon ${c.code} deleted`);
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Could not delete the coupon');
    }
  };

  const isExpired = (c: Coupon) => !!c.expiresAt && new Date(c.expiresAt) < new Date();

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Create Coupon</h2>
        <p className="text-xs text-gray-500 mb-5">Customers enter the code at checkout. The discount applies before shipping and tax.</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-xs font-semibold text-gray-700">Code</Label>
            <Input required placeholder="SUMMER15" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="mt-1 rounded-xl text-sm" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-700">Type</Label>
            <select
              value={form.discountType}
              onChange={(e) => setForm({ ...form, discountType: e.target.value as 'PERCENT' | 'FIXED' })}
              className="mt-1 w-full h-9 rounded-xl border border-gray-200 px-3 text-sm bg-white"
            >
              <option value="PERCENT">Percentage (%)</option>
              <option value="FIXED">Fixed amount (₹)</option>
            </select>
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-700">{form.discountType === 'PERCENT' ? 'Percent off' : 'Rupees off'}</Label>
            <Input required type="number" min="0.01" max={form.discountType === 'PERCENT' ? 100 : undefined} step="0.01" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} className="mt-1 rounded-xl text-sm" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-700">Minimum order (₹)</Label>
            <Input type="number" min="0" placeholder="0" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} className="mt-1 rounded-xl text-sm" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-700">Usage limit</Label>
            <Input type="number" min="1" placeholder="Unlimited" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} className="mt-1 rounded-xl text-sm" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-700">Valid until</Label>
            <Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="mt-1 rounded-xl text-sm" />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs font-semibold text-gray-700">Description</Label>
            <Input placeholder="Shown to the customer when applied" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 rounded-xl text-sm" />
          </div>
        </div>
        <Button type="submit" disabled={saving} className="mt-5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl gap-1.5 text-xs font-semibold cursor-pointer">
          <Plus className="h-4 w-4" /> {saving ? 'Creating...' : 'Create Coupon'}
        </Button>
      </form>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs overflow-x-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">All Coupons</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : coupons.length === 0 ? (
          <p className="text-sm text-gray-500">No coupons yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider bg-gray-50/50">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Min order</th>
                <th className="py-3 px-4">Used</th>
                <th className="py-3 px-4">Expires</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td className="py-3 px-4">
                    <div className="font-bold text-gray-900 flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 text-purple-600" />{c.code}</div>
                    {c.description && <div className="text-xs text-gray-500">{c.description}</div>}
                  </td>
                  <td className="py-3 px-4 font-semibold">{c.discountType === 'PERCENT' ? `${c.discountValue}%` : `₹${c.discountValue}`}</td>
                  <td className="py-3 px-4 text-gray-600">{c.minOrderAmount > 0 ? `₹${c.minOrderAmount}` : '–'}</td>
                  <td className="py-3 px-4 text-gray-600">{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ''}</td>
                  <td className="py-3 px-4 text-gray-600">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN') : 'Never'}</td>
                  <td className="py-3 px-4">
                    {isExpired(c) ? (
                      <Badge className="bg-gray-100 text-gray-600 border-none">Expired</Badge>
                    ) : c.maxUses && c.usedCount >= c.maxUses ? (
                      <Badge className="bg-amber-100 text-amber-800 border-none">Used up</Badge>
                    ) : c.active ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-none">Active</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600 border-none">Disabled</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <Button variant="outline" size="sm" className="rounded-lg text-xs mr-2 cursor-pointer" onClick={() => toggle(c)}>
                      {c.active ? 'Disable' : 'Enable'}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer" onClick={() => remove(c)} title="Delete coupon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
