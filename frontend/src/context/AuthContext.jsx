import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sb_token');
    const stored = localStorage.getItem('sb_user');
    if (token && stored) {
      try { setUser(JSON.parse(stored)); } catch { }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('sb_token', res.data.token);
    localStorage.setItem('sb_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const requestOTP = async (email) => {
    return await api.post('/auth/request-otp', { email });
  };

  const loginWithOTP = async (email, otp) => {
    const res = await api.post('/auth/login-otp', { email, otp });
    localStorage.setItem('sb_token', res.data.token);
    localStorage.setItem('sb_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('sb_token');
    localStorage.removeItem('sb_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, requestOTP, loginWithOTP }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
