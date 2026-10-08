import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { api, setToken, clearToken, getToken, UNAUTHORIZED_EVENT } from '../api/client';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: 'user' | 'admin';
  phone?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  adminLogin: () => Promise<void>;
  signup: (userData: Partial<User> & { email: string; password: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_CACHE_KEY = 'user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Only trust the cached user if we also still have a token
    try {
      const saved = localStorage.getItem(USER_CACHE_KEY);
      return saved && getToken() ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const storeSession = (res: AuthResponse) => {
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(res.user));
  };

  const clearSession = () => {
    clearToken();
    localStorage.removeItem(USER_CACHE_KEY);
    setUser(null);
  };

  // Re-validate the saved session with the backend on page load
  useEffect(() => {
    if (!getToken()) return;
    api<User>('/users/me')
      .then((fresh) => {
        setUser(fresh);
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(fresh));
      })
      .catch(() => {
        /* 401 is handled by the unauthorized event below; network errors keep the cached user */
      });
  }, []);

  // Token expired / rejected by the backend -> log out
  useEffect(() => {
    const onUnauthorized = () => {
      localStorage.removeItem(USER_CACHE_KEY);
      setUser(null);
      toast.error('Your session has expired. Please sign in again.');
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = async (email: string, password: string) => {
    let cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'admin') cleanEmail = 'admin@shophub.com'; // keep the old "admin" shortcut

    const res = await api<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email: cleanEmail, password },
      auth: false,
    });
    storeSession(res);
  };

  const adminLogin = async () => {
    await login('admin@shophub.com', 'admin123');
  };

  const signup = async (userData: Partial<User> & { email: string; password: string }) => {
    const res = await api<AuthResponse>('/auth/register', {
      method: 'POST',
      body: {
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
        address: userData.address || '',
        city: userData.city || '',
        zipCode: userData.zipCode || '',
        country: userData.country || '',
      },
      auth: false,
    });
    storeSession(res);
  };

  const logout = () => {
    clearSession();
  };

  const updateProfile = async (userData: Partial<User>) => {
    if (!user) return;
    const updated = await api<User>('/users/me', {
      method: 'PUT',
      body: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        address: userData.address,
        city: userData.city,
        zipCode: userData.zipCode,
        country: userData.country,
      },
    });
    setUser(updated);
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(updated));
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        adminLogin,
        signup,
        logout,
        updateProfile,
        isAuthenticated: !!user,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
