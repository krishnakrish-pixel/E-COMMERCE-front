import React, { useState } from 'react';
import { MapPin, Plus, Pencil, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useAddresses, SavedAddress } from '../lib/useAddresses';
import { cleanPersonName, cleanZip, validateRequired, validateZip } from '../lib/validation';

const empty = { label: 'Home', firstName: '', lastName: '', phone: '', address: '', city: '', zipCode: '', country: 'India' };

export function SavedAddresses() {
  const { addresses, loading, create, update, setDefault, remove } = useAddresses();
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState(empty);
  const [makeDefault, setMakeDefault] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const open = (a?: SavedAddress) => {
    setErrors({});
    if (a) {
      setForm({ label: a.label, firstName: a.firstName, lastName: a.lastName || '', phone: a.phone || '', address: a.address, city: a.city, zipCode: a.zipCode, country: a.country });
      setMakeDefault(a.defaultAddress);
      setEditing(a.id);
    } else {
      setForm(empty);
      setMakeDefault(addresses.length === 0);
      setEditing('new');
    }
  };

  const set = (name: string, value: string) => {
    let v = value;
    if (name === 'firstName' || name === 'lastName') v = cleanPersonName(value);
    if (name === 'zipCode') v = cleanZip(value, form.country);
    if (name === 'phone') v = value.replace(/[^0-9+()\- ]/g, '').slice(0, 20);
    setForm((f) => ({ ...f, [name]: v }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {
      firstName: validateRequired(form.firstName, 'First name'),
      address: validateRequired(form.address, 'Address'),
      city: validateRequired(form.city, 'City'),
      zipCode: validateZip(form.zipCode, form.country),
      country: validateRequired(form.country, 'Country'),
      phone: form.phone && !/^[0-9+()\- ]{7,20}$/.test(form.phone) ? 'Enter a valid phone number' : '',
    };
    Object.keys(found).forEach((k) => !found[k] && delete found[k]);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      if (editing === 'new') await create({ ...form, makeDefault });
      else await update(editing as string, { ...form, makeDefault });
      toast.success(editing === 'new' ? 'Address saved' : 'Address updated');
      setEditing(null);
    } catch (err: any) {
      toast.error(err.message || 'Could not save the address');
    } finally {
      setSaving(false);
    }
  };

  const act = async (fn: () => Promise<void>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    }
  };

  const Err = ({ k }: { k: string }) => (errors[k] ? <p className="text-xs text-red-600 mt-1">{errors[k]}</p> : null);

  return (
    <Card className="lg:col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" /> Saved Addresses
        </CardTitle>
        {editing === null && addresses.length < 10 && (
          <Button size="sm" onClick={() => open()} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add address
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {editing !== null && (
          <form onSubmit={submit} className="border rounded-2xl p-5 bg-gray-50/60 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label>Label</Label><Input value={form.label} maxLength={40} onChange={(e) => set('label', e.target.value)} placeholder="Home, Office..." /></div>
              <div><Label>First name</Label><Input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} /><Err k="firstName" /></div>
              <div><Label>Last name</Label><Input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} /></div>
              <div className="md:col-span-2"><Label>Address</Label><Input value={form.address} maxLength={300} onChange={(e) => set('address', e.target.value)} /><Err k="address" /></div>
              <div><Label>Phone (optional)</Label><Input value={form.phone} inputMode="tel" onChange={(e) => set('phone', e.target.value)} /><Err k="phone" /></div>
              <div><Label>City</Label><Input value={form.city} onChange={(e) => set('city', e.target.value)} /><Err k="city" /></div>
              <div><Label>PIN / postal code</Label><Input value={form.zipCode} inputMode="numeric" onChange={(e) => set('zipCode', e.target.value)} /><Err k="zipCode" /></div>
              <div><Label>Country</Label><Input value={form.country} onChange={(e) => set('country', e.target.value)} /><Err k="country" /></div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} />
              Use as my default address
            </label>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save address'}</Button>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </form>
        )}

        {loading && addresses.length === 0 ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : addresses.length === 0 && editing === null ? (
          <p className="text-sm text-gray-500">No saved addresses yet. Save one to check out faster next time.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((a) => (
              <div key={a.id} className={`border rounded-2xl p-4 ${a.defaultAddress ? 'border-[#1b5d4e] bg-[#1b5d4e]/5' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{a.label}</span>
                  {a.defaultAddress && <Badge className="bg-[#1b5d4e] text-white border-none">Default</Badge>}
                </div>
                <p className="text-sm text-gray-700">{a.firstName} {a.lastName}</p>
                <p className="text-sm text-gray-600">{a.address}</p>
                <p className="text-sm text-gray-600">{a.city} {a.zipCode}, {a.country}</p>
                {a.phone && <p className="text-xs text-gray-500 mt-1">{a.phone}</p>}
                <div className="flex gap-1 mt-3">
                  {!a.defaultAddress && (
                    <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => act(() => setDefault(a.id), 'Default address changed')}>
                      <Star className="h-3.5 w-3.5" /> Make default
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => open(a)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs text-red-600 hover:text-red-700" onClick={() => act(() => remove(a.id), 'Address deleted')}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
