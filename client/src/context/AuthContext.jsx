import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('workhive_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('workhive_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verify stored session on app mount
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('workhive_token');
      const storedUser = localStorage.getItem('workhive_user');

      // Preserve local state immediately if present
      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        } catch (e) {
          // JSON parse error fallback
        }
      }

      if (storedToken) {
        try {
          const res = await authService.getMe();
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('workhive_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          // ONLY clear session if server explicitly returns 401 Unauthorized (token invalid/expired)
          // Do not logout on network hiccups or 500s
          if (err.response && err.response.status === 401) {
            console.warn('Session expired (401), clearing credentials');
            logout();
          } else {
            console.warn('Session verify check warning (non-401):', err.message);
          }
        }
      }
      setLoading(false);
    };

    verifySession();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const cleanEmail = email ? email.trim() : '';
      const res = await authService.login({ email: cleanEmail, password });
      const { token: receivedToken, user: receivedUser } = res.data;

      setToken(receivedToken);
      setUser(receivedUser);

      localStorage.setItem('workhive_token', receivedToken);
      localStorage.setItem('workhive_user', JSON.stringify(receivedUser));

      return receivedUser;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      setError(message);
      throw new Error(message);
    }
  };

  const register = async (name, email, password, role) => {
    setError(null);
    try {
      const cleanName = name ? name.trim() : '';
      const cleanEmail = email ? email.trim().toLowerCase() : '';
      const res = await authService.register({ name: cleanName, email: cleanEmail, password, role });
      const { token: receivedToken, user: receivedUser } = res.data;

      setToken(receivedToken);
      setUser(receivedUser);

      localStorage.setItem('workhive_token', receivedToken);
      localStorage.setItem('workhive_user', JSON.stringify(receivedUser));

      return receivedUser;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed';
      setError(message);
      throw new Error(message);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setError(null);
    localStorage.removeItem('workhive_token');
    localStorage.removeItem('workhive_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

