import { createContext, useContext, useState, useEffect } from 'react';

const SuperAuthContext = createContext(null);

const SA_TOKEN_KEY = 'sa_token';
const SA_USER_KEY  = 'sa_user';
const API_BASE     = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function SuperAuthProvider({ children }) {
  const [admin,   setAdmin]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token  = localStorage.getItem(SA_TOKEN_KEY);
    const stored = localStorage.getItem(SA_USER_KEY);
    if (token && stored) {
      try { setAdmin(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/superadmin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Login failed');
    localStorage.setItem(SA_TOKEN_KEY, data.data.token);
    localStorage.setItem(SA_USER_KEY,  JSON.stringify(data.data.admin));
    setAdmin(data.data.admin);
    return data.data.admin;
  };

  const logout = () => {
    localStorage.removeItem(SA_TOKEN_KEY);
    localStorage.removeItem(SA_USER_KEY);
    setAdmin(null);
  };

  const getToken = () => localStorage.getItem(SA_TOKEN_KEY);

  return (
    <SuperAuthContext.Provider value={{ admin, loading, login, logout, getToken }}>
      {children}
    </SuperAuthContext.Provider>
  );
}

export const useSuperAuth = () => useContext(SuperAuthContext);

// Fetch helper that auto-attaches superadmin token
export async function saFetch(path, options = {}) {
  const token   = localStorage.getItem(SA_TOKEN_KEY);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Request failed');
  return data.data;
}
