import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Common/Sidebar';
import ReceptionistDashboard from '../components/Receptionist/ReceptionistDashboard';
import WalkInBooking from '../components/Receptionist/WalkInBooking';
import QueueManager from '../components/Receptionist/QueueManager';
import PatientSearch from '../components/Receptionist/PatientSearch';
import PatientVerification from '../components/Receptionist/PatientVerification';
import DoctorStatus from '../components/Receptionist/DoctorStatus';
import ReceptionistReports from '../components/Receptionist/ReceptionistReports';
import AppointmentQueue from '../components/Receptionist/AppointmentQueue';
import {
  LayoutDashboard, CalendarPlus, Users, Search,
  Stethoscope, BarChart2, Clock, QrCode, List
} from 'lucide-react';

const navItems = [
  { path: '/receptionist/dashboard',    label: 'Dashboard',        icon: <LayoutDashboard size={18} /> },
  { path: '/receptionist/walkin',       label: 'Walk-In Booking',  icon: <CalendarPlus size={18} /> },
  { path: '/receptionist/queue',        label: 'Queue Manager',    icon: <Clock size={18} /> },
  { path: '/receptionist/verify',       label: 'Verify Patient',   icon: <QrCode size={18} /> },
  { path: '/receptionist/appointments', label: 'All Appointments', icon: <List size={18} /> },
  { path: '/receptionist/patients',     label: 'Patient Search',   icon: <Search size={18} /> },
  { path: '/receptionist/doctors',      label: 'Doctor Status',    icon: <Stethoscope size={18} /> },
  { path: '/receptionist/reports',      label: 'Reports',          icon: <BarChart2 size={18} /> },
];

export default function ReceptionistLayout() {
  return (
    <div className="app-layout">
      <Sidebar items={navItems} role="receptionist" />
      <main className="main-area">
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"    element={<ReceptionistDashboard />} />
          <Route path="walkin"       element={<WalkInBooking />} />
          <Route path="queue"        element={<QueueManager />} />
          <Route path="verify"       element={<PatientVerification />} />
          <Route path="appointments" element={<AppointmentQueue />} />
          <Route path="patients"     element={<PatientSearch />} />
          <Route path="doctors"      element={<DoctorStatus />} />
          <Route path="reports"      element={<ReceptionistReports />} />
        </Routes>
      </main>
    </div>
  );
}
