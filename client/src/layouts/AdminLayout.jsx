import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Common/Sidebar';
import AdminDashboard from '../components/Admin/AdminDashboard';
import AdminAppointments from '../components/Admin/AdminAppointments';
import AdminDoctors from '../components/Admin/AdminDoctors';
import AdminUsers from '../components/Admin/AdminUsers';
import AdminAnalytics from '../components/Admin/AdminAnalytics';
import ClinicSettings from '../components/Admin/ClinicSettings';
import AuditLog from '../components/Admin/AuditLog';
import {
  LayoutDashboard, Calendar, Stethoscope, Users, BarChart2, Settings, Shield
} from 'lucide-react';

const navItems = [
  { path: '/admin/dashboard',    label: 'Dashboard',     icon: <LayoutDashboard size={18} /> },
  { path: '/admin/appointments', label: 'Appointments',  icon: <Calendar size={18} /> },
  { path: '/admin/doctors',      label: 'Doctors',       icon: <Stethoscope size={18} /> },
  { path: '/admin/users',        label: 'Staff & Users', icon: <Users size={18} /> },
  { path: '/admin/analytics',    label: 'Analytics',     icon: <BarChart2 size={18} /> },
  { path: '/admin/settings',     label: 'Settings',      icon: <Settings size={18} /> },
  { path: '/admin/audit',        label: 'Audit Log',     icon: <Shield size={18} /> },
];

export default function AdminLayout() {
  return (
    <div className="app-layout">
      <Sidebar items={navItems} role="admin" />
      <main className="main-area">
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"    element={<AdminDashboard />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="doctors"      element={<AdminDoctors />} />
          <Route path="users"        element={<AdminUsers />} />
          <Route path="analytics"    element={<AdminAnalytics />} />
          <Route path="settings"     element={<ClinicSettings />} />
          <Route path="audit"        element={<AuditLog />} />
        </Routes>
      </main>
    </div>
  );
}
