import api from './api';

class AuthService {
  // Register new owner
  static async register(userData) {
    return api.post('/auth/register', userData);
  }
  
  // Login user
  static async login(identifier, password) {
    return api.post('/auth/login', { identifier, password });
  }
  
  // Get current user profile
  static async getProfile() {
    return api.get('/auth/profile');
  }
  
  // Update profile
  static async updateProfile(profileData) {
    return api.put('/auth/profile', profileData);
  }
  
  // Change password
  static async changePassword(currentPassword, newPassword) {
    return api.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
  }
  
  // Store auth data in localStorage
  static setAuthData(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  
  // Get auth data from localStorage
  static getAuthData() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    return {
      token,
      user: user ? JSON.parse(user) : null
    };
  }
  
  // Clear auth data
  static clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  
  // Check if user is authenticated
  static isAuthenticated() {
    return !!localStorage.getItem('token');
  }
}

export default AuthService;