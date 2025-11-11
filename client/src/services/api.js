import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (name, email, password) =>
    api.post('/auth/register', { name, email, password }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  googleLogin: (googleId, name, email, profilePicture) =>
    api.post('/auth/google-login', { googleId, name, email, profilePicture }),
  getProfile: () =>
    api.get('/auth/profile'),
};

export const bookAPI = {
  getBooks: (params) =>
    api.get('/books', { params }),
  getBookById: (id) =>
    api.get(`/books/${id}`),
  getAvailability: (id) =>
    api.get(`/books/${id}/availability`),
  createBook: (data) =>
    api.post('/books', data),
  updateBook: (id, data) =>
    api.put(`/books/${id}`, data),
  deleteBook: (id) =>
    api.delete(`/books/${id}`),
  borrowBook: (bookId) =>
    api.post('/books/borrow', { bookId }),
  returnBook: (bookId) =>
    api.post('/books/return', { bookId }),
};

export const printoutAPI = {
  createPrintout: (data) =>
    api.post('/printouts', data),
  confirmPayment: (printoutId, transactionId, paymentMethod) =>
    api.post('/printouts/confirm-payment', { printoutId, transactionId, paymentMethod }),
  getPrintoutHistory: () =>
    api.get('/printouts/history'),
  getPrintoutById: (id) =>
    api.get(`/printouts/${id}`),
  updatePrintoutStatus: (printoutId, status) =>
    api.put(`/printouts/${printoutId}/status`, { status }),
  cancelPrintout: (printoutId) =>
    api.delete(`/printouts/${printoutId}`),
};

export const adminAPI = {
  getAllUsers: () =>
    api.get('/admin/users'),
  getUserStats: () =>
    api.get('/admin/users/stats'),
  getUserBorrowHistory: (userId) =>
    api.get(`/admin/users/${userId}/borrow-history`),
  promoteUserToAdmin: (userId) =>
    api.put(`/admin/users/${userId}/promote`),
  demoteAdminToUser: (userId) =>
    api.put(`/admin/users/${userId}/demote`),
  deactivateUser: (userId) =>
    api.put(`/admin/users/${userId}/deactivate`),
  getAllBooks: () =>
    api.get('/admin/books'),
  getBookStats: () =>
    api.get('/admin/books/stats'),
  getPrintoutStats: () =>
    api.get('/admin/printouts/stats'),
  generateReport: (reportType) =>
    api.get('/admin/reports', { params: { reportType } }),
};

export default api;
