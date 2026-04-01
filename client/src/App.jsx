import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { authService } from './services/api';

// Pages
import LoginPage from './pages/LoginPage';
import PatientHome from './pages/PatientHome';
import PatientLayout from './layouts/PatientLayout';
import DoctorLayout from './layouts/DoctorLayout';
import ReceptionistLayout from './layouts/ReceptionistLayout';
import AdminLayout from './layouts/AdminLayout';

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<PatientHome />} />
      <Route path="/login" element={user ? <Navigate to={`/${user.role}`} replace /> : <LoginPage />} />
      <Route path="/patient/*" element={<ProtectedRoute allowedRoles={['patient']}><PatientLayout /></ProtectedRoute>} />
      <Route path="/doctor/*" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorLayout /></ProtectedRoute>} />
      <Route path="/receptionist/*" element={<ProtectedRoute allowedRoles={['receptionist']}><ReceptionistLayout /></ProtectedRoute>} />
      <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  const login = (userData) => setUser(userData);
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-brand">
        <div className="loading-logo">🏥</div>
        <h2 className="fw-900">MediCore</h2>
        <p className="text-muted">Clinic Management System</p>
      </div>
      <div className="spinner" />
      <p className="text-muted text-sm">Loading...</p>
    </div>
  );

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
