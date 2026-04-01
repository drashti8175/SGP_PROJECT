import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Common/Sidebar';
import PatientDashboard from '../components/Patient/PatientDashboard';
import BookAppointment from '../components/Patient/BookAppointment';
import MyAppointments from '../components/Patient/MyAppointments';
import QueueStatus from '../components/Patient/QueueStatus';
import MyPrescriptions from '../components/Patient/MyPrescriptions';
import AppointmentQR from '../components/Patient/AppointmentQR';
import PatientProfile from '../components/Patient/PatientProfile';
import PatientHistoryView from '../components/Patient/PatientHistoryView';
import { LayoutDashboard, CalendarPlus, Calendar, Clock, Pill, QrCode, User, FileText } from 'lucide-react';

const navItems = [
  { path: '/patient/dashboard',    label: 'Dashboard',       icon: <LayoutDashboard size={18} /> },
  { path: '/patient/book',         label: 'Book Appointment', icon: <CalendarPlus size={18} /> },
  { path: '/patient/appointments', label: 'My Appointments',  icon: <Calendar size={18} /> },
  { path: '/patient/queue',        label: 'Queue Status',     icon: <Clock size={18} /> },
  { path: '/patient/qr',          label: 'My QR Code',       icon: <QrCode size={18} /> },
  { path: '/patient/history',      label: 'Medical History',  icon: <FileText size={18} /> },
  { path: '/patient/prescriptions',label: 'Prescriptions',    icon: <Pill size={18} /> },
  { path: '/patient/profile',      label: 'Profile',          icon: <User size={18} /> },
];

export default function PatientLayout() {
  return (
    <div className="app-layout">
      <Sidebar items={navItems} role="patient" />
      <main className="main-area">
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"    element={<PatientDashboard />} />
          <Route path="book"         element={<BookAppointment />} />
          <Route path="appointments" element={<MyAppointments />} />
          <Route path="queue"        element={<QueueStatus />} />
          <Route path="qr"           element={<AppointmentQR />} />
          <Route path="history"      element={<PatientHistoryView />} />
          <Route path="prescriptions" element={<MyPrescriptions />} />
          <Route path="profile"      element={<PatientProfile />} />
        </Routes>
      </main>
    </div>
  );
}
