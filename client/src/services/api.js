import axios from 'axios';
import { io } from 'socket.io-client';

export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5
});

export const authService = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
    }
    return data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  register: async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    return data;
  }
};

export const doctorService = {
  getQueue: () => api.get('/doctor/queue').then(r => r.data),
  getStats: () => api.get('/doctor/stats').then(r => r.data),
  callPatient: (appointment_id) => api.post('/doctor/call_next', { appointment_id }).then(r => r.data),
  completeConsultation: (appointment_id) => api.post('/doctor/complete', { appointment_id }).then(r => r.data),
  prescribe: (data) => api.post('/doctor/prescribe', data).then(r => r.data),
  getPatient: (id) => api.get(`/doctor/patient/${id}`).then(r => r.data),
  getPatientHistory: (id) => api.get(`/doctor/patient-history/${id}`).then(r => r.data),
  getPerformance: () => api.get('/doctor/performance').then(r => r.data),
  getNotifications: () => api.get('/doctor/notifications').then(r => r.data),
};

export const patientService = {
  getDoctors: () => api.get('/patient/doctors').then(r => r.data),
  book: (data) => api.post('/patient/book', data).then(r => r.data),
  getAppointments: () => api.get('/patient/appointments').then(r => r.data),
  getQueue: (doctor_id) => api.get(`/patient/queue/${doctor_id}`).then(r => r.data),
  getFullQueue: (doctor_id) => api.get(`/patient/full-queue/${doctor_id}`).then(r => r.data),
  getPrescriptions: () => api.get('/patient/prescriptions').then(r => r.data),
};

export const receptionistService = {
  getRequests: () => api.get('/receptionist/requests').then(r => r.data),
  getDashboardStats: () => api.get('/receptionist/dashboard-stats').then(r => r.data),
  updateStatus: (id, status, rejection_reason) => api.post('/receptionist/update_status', { appointment_id: id, status, rejection_reason }).then(r => r.data),
  checkIn: (id) => api.post('/receptionist/checkin', { appointment_id: id }).then(r => r.data),
  updatePayment: (id, payment_status, payment_method, payment_amount) => api.post('/receptionist/payment', { appointment_id: id, payment_status, payment_method, payment_amount }).then(r => r.data),
  walkIn: (data) => api.post('/receptionist/walkin', data).then(r => r.data),
  searchPatients: (q) => api.get(`/receptionist/search-patients?q=${q}`).then(r => r.data),
  getPatientHistory: (id) => api.get(`/receptionist/patient-history/${id}`).then(r => r.data),
  getDoctors: () => api.get('/receptionist/doctors').then(r => r.data),
  getAnalytics: () => api.get('/receptionist/analytics').then(r => r.data),
};

export const adminService = {
  getStats: () => api.get('/admin/stats').then(r => r.data),
  getUsers: () => api.get('/admin/users').then(r => r.data),
  updateUserRole: (user_id, role) => api.post('/admin/users/update-role', { user_id, role }).then(r => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then(r => r.data),
  getDoctors: () => api.get('/admin/doctors').then(r => r.data),
  addDoctor: (data) => api.post('/admin/doctors/add', data).then(r => r.data),
  updateDoctor: (data) => api.post('/admin/doctors/update', data).then(r => r.data),
  deleteDoctor: (id) => api.delete(`/admin/doctors/${id}`).then(r => r.data),
  getAppointments: (params) => api.get('/admin/appointments', { params }).then(r => r.data),
  updateAppointment: (id, status) => api.post('/admin/appointments/update', { appointment_id: id, status }).then(r => r.data),
  batchApprove: (ids) => api.post('/admin/appointments/batch-approve', { ids }).then(r => r.data),
  getAnalytics: () => api.get('/admin/analytics').then(r => r.data),
};
