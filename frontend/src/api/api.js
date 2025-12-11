import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor per aggiungere il token a ogni richiesta
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

// Interceptor per gestire errori di autenticazione
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

// Auth
export const authAPI = {
  getGoogleLoginURL: () => api.get('/auth/google'),
  handleCallback: (code) => api.get(`/auth/callback?code=${code}`),
  getCurrentUser: () => api.get('/me'),
};

// User
export const userAPI = {
  getCurrentUser: () => api.get('/me'),
  updateProfile: (data) => api.put('/me', data),
  getMyDonations: () => api.get('/me/donations'),
  getMyAppointments: () => api.get('/me/appointments'),
};

// Admin - Users
export const adminUserAPI = {
  getUsers: () => api.get('/admin/users'),
  getUser: (id) => api.get(`/admin/users/${id}`),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getExpiring: () => api.get('/admin/users/expiring'),
};

// Admin - Donations
export const adminDonationAPI = {
  getDonations: () => api.get('/admin/donations'),
  createDonation: (data) => api.post('/admin/donations', data),
  getDonorHistory: (donorId) => api.get(`/admin/donors/${donorId}/donations`),
};

// Admin - Appointments
export const adminAppointmentAPI = {
  getAppointments: (params) => api.get('/admin/appointments', { params }),
  proposeAppointment: (donorId, dates) => api.post('/admin/appointments/propose', {
    donor_id: donorId,
    ...dates
  }),
  updateAppointment: (id, data) => api.put(`/admin/appointments/${id}`, data),
  deleteAppointment: (id) => api.delete(`/admin/appointments/${id}`),
  cancelAppointment: (id) => api.post(`/admin/appointments/${id}/cancel`),
};

// Appointments (Donor)
export const appointmentAPI = {
  confirmAppointment: (id, selectedDate) =>
    api.post(`/appointments/${id}/confirm`, { selected_date: selectedDate }),
};

// Admin - Schedule
export const adminScheduleAPI = {
  getSchedule: () => api.get('/admin/schedule'),
  updateSchedule: (data) => api.put('/admin/schedule', data),
  getExcludedDates: () => api.get('/admin/excluded-dates'),
  addExcludedDate: (data) => api.post('/admin/excluded-dates', data),
  deleteExcludedDate: (id) => api.delete(`/admin/excluded-dates/${id}`),
  getSpecialCapacities: () => api.get('/admin/special-capacities'),
  setSpecialCapacity: (data) => api.post('/admin/special-capacities', data),
  deleteSpecialCapacity: (id) => api.delete(`/admin/special-capacities/${id}`),
};

// Admin - Suspensions
export const adminSuspensionAPI = {
  getSuspensions: (donorId) => api.get('/admin/suspensions', { params: { donor_id: donorId } }),
  createSuspension: (data) => api.post('/admin/suspensions', data),
  endSuspension: (id) => api.put(`/admin/suspensions/${id}/end`),
};

// Admin - Registration Requests
export const adminRegistrationAPI = {
  getRequests: (status) => api.get('/admin/registration-requests', { params: { status } }),
  getPendingCount: () => api.get('/admin/registration-requests/count'),
  approveRequest: (id, data) => api.post(`/admin/registration-requests/${id}/approve`, data),
  associateRequest: (id, userId) => api.post(`/admin/registration-requests/${id}/associate`, { user_id: userId }),
  rejectRequest: (id, note) => api.post(`/admin/registration-requests/${id}/reject`, { note }),
  deleteRequest: (id) => api.delete(`/admin/registration-requests/${id}`),
};

export default api;
