import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export interface SavedAddress {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  defaultAddress: boolean;
}

export type AddressInput = Omit<SavedAddress, 'id' | 'defaultAddress'> & { makeDefault?: boolean };

/** The signed-in customer's address book (every call returns the full updated list). */
export function useAddresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setAddresses([]);
      return;
    }
    setLoading(true);
    try {
      setAddresses(await api<SavedAddress[]>('/addresses'));
    } catch {
      /* keep what we have */
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (input: AddressInput) =>
    setAddresses(await api<SavedAddress[]>('/addresses', { method: 'POST', body: input }));
  const update = async (id: string, input: AddressInput) =>
    setAddresses(await api<SavedAddress[]>(`/addresses/${id}`, { method: 'PUT', body: input }));
  const setDefault = async (id: string) =>
    setAddresses(await api<SavedAddress[]>(`/addresses/${id}/default`, { method: 'PUT' }));
  const remove = async (id: string) =>
    setAddresses(await api<SavedAddress[]>(`/addresses/${id}`, { method: 'DELETE' }));

  return { addresses, loading, reload: load, create, update, setDefault, remove };
}
