import React, { createContext, useState, useContext, useEffect } from 'react';
import AuthService from '../services/authService';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const { user: storedUser } = AuthService.getAuthData();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = async (identifier, password) => {
    try {
      const response = await AuthService.login(identifier, password);
      AuthService.setAuthData(response.data);
      setUser(response.data.user);
      toast.success('Login successful!');
      return response;
    } catch (error) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await AuthService.register(userData);
      AuthService.setAuthData(response.data);
      setUser(response.data.user);
      toast.success('Registration successful!');
      return response;
    } catch (error) {
      toast.error(error.message || 'Registration failed');
      throw error;
    }
  };

  const logout = () => {
    AuthService.clearAuthData();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await AuthService.updateProfile(profileData);
      setUser(response.data.user);
      AuthService.setAuthData({
        token: localStorage.getItem('token'),
        user: response.data.user
      });
      toast.success('Profile updated successfully!');
      return response;
    } catch (error) {
      toast.error(error.message || 'Update failed');
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};