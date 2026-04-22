import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User, RegisterPayload } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  googleLogin: (token: string, role?: string) => Promise<User>;
  register: (data: RegisterPayload) => Promise<User>;
  logout: () => void;
  loading: boolean;
  setUser: (u: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.me()
      .then(setUser)
      .catch(() => { localStorage.removeItem('token'); setToken(null); })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (email: string, password: string): Promise<User> => {
    const { token: t, user: u } = await api.login(email, password);
    localStorage.setItem('token', t);
    setToken(t);
    setUser(u);
    return u;
  };

  const googleLogin = async (googleToken: string, role?: string): Promise<User> => {
    const { token: t, user: u } = await api.googleLogin(googleToken, role);
    localStorage.setItem('token', t);
    setToken(t);
    setUser(u);
    return u;
  };

  const register = async (data: RegisterPayload): Promise<User> => {
    const { token: t, user: u } = await api.register(data);
    localStorage.setItem('token', t);
    setToken(t);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
