import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add timestamp to prevent caching for general GETs
    // Avoid auth/me and auth endpoints to prevent needless cache-busting loops
    const url = config.url || '';
    const isAuthIdentityEndpoint = url.includes('/api/auth/me');
    if (config.method === 'get' && !isAuthIdentityEndpoint) {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      const { status, data } = error.response;
      const reqUrl = error.config?.url || '';
      
      switch (status) {
        case 401:
          // Unauthorized
          // For identity endpoint, just clear token quietly to avoid redirect loops
          localStorage.removeItem('token');
          if (!reqUrl.includes('/api/auth/me')) {
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
          break;
          
        case 403:
          // Forbidden
          toast.error(data.message || 'Access denied');
          break;
          
        case 404:
          // Not found
          toast.error(data.message || 'Resource not found');
          break;
          
        case 422:
          // Validation error
          if (data.errors && Array.isArray(data.errors)) {
            data.errors.forEach(err => {
              toast.error(`${err.field}: ${err.message}`);
            });
          } else {
            toast.error(data.message || 'Validation failed');
          }
          break;
          
        case 500:
          // Server error
          toast.error(data.message || 'Server error occurred');
          break;
          
        default:
          toast.error(data.message || 'An error occurred');
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error - please check your connection');
    } else {
      // Other error
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  logout: () => api.post('/api/auth/logout'),
  getProfile: () => api.get('/api/auth/me'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
  changePassword: (data) => api.put('/api/auth/change-password', data),
  verifyEmail: () => api.post('/api/auth/verify-email'),
};

export const adminAPI = {
  getDashboard: () => api.get('/api/admin/dashboard'),
  getHospitals: (params) => api.get('/api/admin/hospitals', { params }),
  getDonors: (params) => api.get('/api/admin/donors', { params }),
  getTickets: (params) => api.get('/api/admin/tickets', { params }),
  getAnalytics: (params) => api.get('/api/admin/analytics', { params }),
  getAppointments: (params) => api.get('/api/admin/appointments', { params }),
  markAppointmentNoShow: (id, data) => api.put(`/api/admin/appointments/${id}/mark-no-show`, data),
  cancelAppointmentAdmin: (id, data) => api.put(`/api/admin/appointments/${id}/cancel-admin`, data),
  approveHospital: (id, data) => api.put(`/api/admin/hospitals/${id}/approve`, data),
  approveDonor: (id) => api.post(`/api/admin/donors/${id}/approve`),
  rejectDonor: (id, data) => api.post(`/api/admin/donors/${id}/reject`, data),
  assignTicket: (id, data) => api.put(`/api/admin/tickets/${id}/assign`, data),
  resolveTicket: (id, data) => api.put(`/api/admin/tickets/${id}/resolve`, data),
  sendBroadcast: (data) => api.post('/api/admin/broadcast', data),
  updateDonorStatus: (id, data) => api.put(`/api/admin/donors/${id}/status`, data),
};

export const hospitalAPI = {
  getDashboard: () => api.get('/api/hospital/dashboard'),
  getProfile: () => api.get('/api/hospital/profile'),
  updateProfile: (data) => api.put('/api/hospital/profile', data),
  getInventory: (params) => api.get('/api/hospital/inventory', { params }),
  updateInventory: (data) => api.put('/api/hospital/inventory', data),
  deleteInventoryItem: (id) => api.delete(`/api/hospital/inventory/${id}`),
  getTickets: (params) => api.get('/api/hospital/tickets', { params }),
  createTicket: (data) => api.post('/api/hospital/tickets', data),
  getAppointments: (params) => api.get('/api/hospital/appointments', { params }),
  confirmAppointment: (id, data) => api.put(`/api/hospital/appointments/${id}/confirm`, data),
  cancelAppointment: (id, data) => api.put(`/api/hospital/appointments/${id}/cancel`, data),
  getDonors: (params) => api.get('/api/hospital/donors', { params }),
};

export const donorAPI = {
  getDashboard: () => api.get('/api/donor/dashboard'),
  getProfile: () => api.get('/api/donor/profile'),
  updateProfile: (data) => api.put('/api/donor/profile', data),
  getHospitals: (params) => api.get('/api/donor/hospitals', { params }),
  getAppointments: (params) => api.get('/api/donor/appointments', { params }),
  bookAppointment: (data) => api.post('/api/donor/appointments', data),
  cancelAppointment: (id, data) => api.put(`/api/donor/appointments/${id}/cancel`, data),
  rescheduleAppointment: (id, data) => api.put(`/api/donor/appointments/${id}/reschedule`, data),
  submitFeedback: (id, data) => api.post(`/api/donor/appointments/${id}/feedback`, data),
  getTickets: (params) => api.get('/api/donor/tickets', { params }),
  respondToTicket: (id, data) => api.post(`/api/donor/tickets/${id}/respond`, data),
  withdrawTicketResponse: (ticketId, responseId) => api.delete(`/api/donor/tickets/${ticketId}/response/${responseId}`),
  getDonationHistory: (params) => api.get('/api/donor/donation-history', { params }),
  updatePreferences: (data) => api.put('/api/donor/preferences', data),
};

export const ticketsAPI = {
  getTickets: (params) => api.get('/api/tickets', { params }),
  getTicket: (id) => api.get(`/api/tickets/${id}`),
  createTicket: (data) => api.post('/api/tickets/create', data),
  updateTicketStatus: (id, data) => api.put(`/api/tickets/${id}/status`, data),
  getNearbyTickets: (lat, lng, params) => api.get(`/api/tickets/nearby/${lat}/${lng}`, { params }),
};

export const appointmentsAPI = {
  getAppointments: (params) => api.get('/api/appointments', { params }),
  getAppointment: (id) => api.get(`/api/appointments/${id}`),
  getAvailableSlots: (hospitalId, params) => api.get(`/api/appointments/hospital/${hospitalId}/available-slots`, { params }),
};

export const hospitalsAPI = {
  getNearbyHospitals: (longitude, latitude, maxDistance = 50000) => 
    api.get('/api/hospitals/nearby', { params: { longitude, latitude, maxDistance } }),
  searchHospitals: (params) => api.get('/api/hospitals/public/search', { params }),
  getAll: () => api.get('/api/hospitals/get-all'),
  getById: (id) => api.get(`/api/hospital/${id}`),
};

export const notificationsAPI = {
  getNotifications: (params) => api.get('/api/notifications', { params }),
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
  markAsRead: (id) => api.put(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.put('/api/notifications/mark-all-read'),
  deleteNotification: (id) => api.delete(`/api/notifications/${id}`),
  getNotification: (id) => api.get(`/api/notifications/${id}`),
};

// Utility functions
export const handleApiError = (error) => {
  if (error.response) {
    return error.response.data.message || 'An error occurred';
  } else if (error.request) {
    return 'Network error - please check your connection';
  } else {
    return 'An unexpected error occurred';
  }
};

export const createFormData = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });
  return formData;
};

export default api;
