import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('devpad_token') || localStorage.getItem('devpad_token');
    const storedUser = sessionStorage.getItem('devpad_user') || localStorage.getItem('devpad_user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password, rememberMe = false) => {
    const res = await api.post('/auth/login', { email, password });
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('devpad_token', res.data.token);
    storage.setItem('devpad_user', JSON.stringify(res.data.user));
    if (rememberMe) {
      sessionStorage.removeItem('devpad_token');
      sessionStorage.removeItem('devpad_user');
    }
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    sessionStorage.setItem('devpad_token', res.data.token);
    sessionStorage.setItem('devpad_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    sessionStorage.removeItem('devpad_token');
    sessionStorage.removeItem('devpad_user');
    localStorage.removeItem('devpad_token');
    localStorage.removeItem('devpad_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
