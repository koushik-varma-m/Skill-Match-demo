import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios defaults
  axios.defaults.withCredentials = true;
  axios.defaults.baseURL = 'http://localhost:3000';

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('Checking auth status...');
      const response = await axios.get('/api/user/profile');
      console.log('Auth check response:', response.data);
      setUser(response.data);
    } catch (error) {
      console.error('Auth check failed:', error.response?.data?.message || error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Attempting login...');
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });
      console.log('Login response:', response.data);
      setUser(response.data.user);
      return { 
        success: true,
        user: response.data.user
      };
    } catch (error) {
      console.error('Login error:', error.response?.data?.message || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log('Attempting registration...');
      const response = await axios.post('/api/auth/signup', userData);
      console.log('Registration response:', response.data);
      setUser(response.data.user);
      return { 
        success: true,
        user: response.data.user
      };
    } catch (error) {
      console.error('Registration error:', error.response?.data?.message || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = async () => {
    try {
      console.log('Attempting logout...');
      await axios.post('/api/auth/logout');
      console.log('Logout successful');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error.response?.data?.message || error.message);
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