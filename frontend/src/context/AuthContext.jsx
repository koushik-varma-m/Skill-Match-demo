import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  axios.defaults.withCredentials = true;
  axios.defaults.baseURL = 'http://localhost:3000';

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/user/profile');
      setUser(response.data);
    } catch (error) {
      // 401 is expected when user is not logged in - don't log as error
      if (error.response?.status !== 401) {
      console.error('Auth check failed:', error.response?.data?.message || error.message);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });
      setUser(response.data.user);
      return { 
        success: true,
        user: response.data.user
      };
    } catch (error) {
      const errorData = error.response?.data || {};
      return {
        success: false,
        error: errorData.error || errorData.message || 'Login failed',
        errors: errorData.errors || null
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/signup', userData);
      setUser(response.data.user);
      return { 
        success: true,
        user: response.data.user
      };
    } catch (error) {
      const errorData = error.response?.data || {};
      return {
        success: false,
        error: errorData.error || errorData.message || 'Registration failed',
        errors: errorData.errors || null
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
      setUser(null);
    } catch (error) {
      // Logout should work even if the request fails
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 