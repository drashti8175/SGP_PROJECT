import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Common/Sidebar';
import DoctorDashboard from '../components/Doctor/DoctorDashboard';
import QueueManagement from '../components/Doctor/QueueManagement';
import PatientDetails from '../components/Doctor/PatientDetails';
import PrescribePage from '../components/Doctor/PrescribePage';
import PatientHistoryPage from '../components/Doctor/PatientHistoryPage';
import PerformancePage from '../components/Doctor/PerformancePage';
import NotificationsPage from '../components/Doctor/NotificationsPage';
import DoctorProfile from '../components/Doctor/DoctorProfile';
import {
  LayoutDashboard, Users, User, FileText, Clock, BarChart2, Bell, Stethoscope
} from 'lucide-react';

const navItems = [
  { path: '/doctor/dashboard', label: 'Dashboard',    icon: <LayoutDashboard size={18} /> },
  { path: '/doctor/queue',     label: 'Queue',         icon: <Users size={18} /> },
  { path: '/doctor/patient',   label: 'Patient Details', icon: <User size={18} /> },
  { path: '/doctor/prescribe', label: 'Prescribe',     icon: <FileText size={18} /> },
  { path: '/doctor/history',   label: 'History',       icon: <Clock size={18} /> },
  { path: '/doctor/performance', label: 'Reports',     icon: <BarChart2 size={18} /> },
  { path: '/doctor/notifications', label: 'Alerts',   icon: <Bell size={18} /> },
  { path: '/doctor/profile',   label: 'Profile',       icon: <Stethoscope size={18} /> },
];

export default function DoctorLayout() {
  return (
    <div className="app-layout">
      <Sidebar items={navItems} role="doctor" />
      <main className="main-area">
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"     element={<DoctorDashboard />} />
          <Route path="queue"         element={<QueueManagement />} />
          <Route path="patient"       element={<PatientDetails />} />
          <Route path="prescribe"     element={<PrescribePage />} />
          <Route path="history"       element={<PatientHistoryPage />} />
          <Route path="performance"   element={<PerformancePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile"       element={<DoctorProfile />} />
        </Routes>
      </main>
    </div>
  );
}
