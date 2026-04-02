import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService, socket } from '../../services/api';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Stethoscope, DollarSign, Clock,
  AlertCircle, CheckCircle2, XCircle, TrendingUp, Activity,
  Calendar, Shield, RefreshCw, UserPlus, BarChart2
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const s = await adminService.getStats();
      setStats(s);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchStats();
    socket.on('queue_updated', fetchStats);
    socket.on('appointment_updated', fetchStats);
    return () => { socket.off('queue_updated', fetchStats); socket.off('appointment_updated', fetchStats); };
  }, [fetchStats]);

  const maxBar = Math.max(...(stats?.last7?.map(d => d.count) || [1]), 1);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title"><Shield size={22} /> Admin Control Panel</h1>
          <p className="page-sub" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={13} />
            {time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            &nbsp;·&nbsp;<span className="live-clock">{time.toLocaleTimeString()}</span>
          </p>
        </div>
        <div className="header-actions">
          
        </div>
      </div>

      {/* Emergency Alert */}
      {stats?.emergency > 0 && (
        <div className="cdss-banner" style={{ background: '#fee2e2', borderColor: '#fca5a5' }}>
          <AlertCircle size={16} style={{ color: '#dc2626' }} />
          <strong style={{ color: '#dc2626' }}>🚨 {stats.emergency} Emergency patient(s) today!</strong>
          <button className="btn btn-sm btn-danger" onClick={() => navigate('/admin/appointments')}>View</button>
        </div>
      )}

      {/* Pending Alert */}
      {stats?.pending > 0 && (
        <div className="cdss-banner">
          <Clock size={16} />
          <strong>{stats.pending} appointment(s) pending approval</strong>
          <button className="btn btn-sm btn-primary" onClick={() => navigate('/admin/appointments')}>
            Approve Now
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <StatCard icon={<Calendar size={20} />} label="Today" value={stats?.total_today || 0} />
        <StatCard icon={<TrendingUp size={20} />} label="This Week" value={stats?.total_week || 0} color="primary" />
        <StatCard icon={<Clock size={20} />} label="Waiting" value={stats?.waiting || 0} color="warning" />
        <StatCard icon={<CheckCircle2 size={20} />} label="Completed" value={stats?.completed || 0} color="success" />
        <StatCard icon={<Users size={20} />} label="Total Patients" value={stats?.total_patients || 0} />
        <StatCard icon={<Stethoscope size={20} />} label="Doctors" value={stats?.total_doctors || 0} color="primary" />
        <StatCard icon={<XCircle size={20} />} label="No-Shows" value={stats?.no_show || 0} color="danger" />
        <StatCard icon={<DollarSign size={20} />} label="Revenue" value={`₹${(stats?.total_revenue || 0).toLocaleString()}`} color="success" />
      </div>

      {/* Quick Nav */}
      <div className="admin-quick-nav">
        {[
          { label: 'Appointments', icon: '📅', path: '/admin/appointments', color: '#2563eb' },
          { label: 'Doctors', icon: '👨‍⚕️', path: '/admin/doctors', color: '#0891b2' },
          { label: 'Staff & Users', icon: '👥', path: '/admin/users', color: '#7c3aed' },
          { label: 'Analytics', icon: '📊', path: '/admin/analytics', color: '#10b981' },
          { label: 'Clinic Settings', icon: '⚙️', path: '/admin/settings', color: '#f59e0b' },
        ].map(item => (
          <motion.button key={item.path} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            className="quick-nav-btn" onClick={() => navigate(item.path)}>
            <span className="qn-icon" style={{ background: item.color, fontSize: 18 }}>{item.icon}</span>
            <span>{item.label}</span>
          </motion.button>
        ))}
      </div>

      <div className="two-col-grid">
        {/* 7-Day Chart */}
        <div className="card">
          <h3 className="card-title mb-4"><BarChart2 size={18} /> Appointments — Last 7 Days</h3>
          <div className="bar-chart" style={{ height: 160 }}>
            {stats?.last7?.map((d, i) => (
              <div key={i} className="bar-col">
                <div className="bar-fill" style={{ height: `${(d.count / maxBar) * 100}%`, background: 'var(--primary)' }}>
                  {d.count > 0 && <span className="bar-val">{d.count}</span>}
                </div>
                <span className="bar-label">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Overview */}
        <div className="card">
          <h3 className="card-title mb-4"><Activity size={18} /> System Overview</h3>
          <div className="quick-stats">
            <div className="quick-stat-item">
              <span className="text-muted">System Status</span>
              <span className="badge badge-success">● Online</span>
            </div>
            <div className="quick-stat-item">
              <span className="text-muted">Database</span>
              <span className="badge badge-success">● MongoDB Atlas</span>
            </div>
            <div className="quick-stat-item">
              <span className="text-muted">Total Staff</span>
              <span className="fw-700">{stats?.total_staff || 0} members</span>
            </div>
            <div className="quick-stat-item">
              <span className="text-muted">Pending Approvals</span>
              <span className={`fw-700 ${stats?.pending > 0 ? 'text-warning' : 'text-success'}`}>
                {stats?.pending || 0}
              </span>
            </div>
            <div className="quick-stat-item">
              <span className="text-muted">Revenue (est.)</span>
              <span className="fw-700 text-success">₹{(stats?.total_revenue || 0).toLocaleString()}</span>
            </div>
            <div className="quick-stat-item">
              <span className="text-muted">No-Show Rate</span>
              <span className="fw-700">
                {stats?.total_today > 0
                  ? `${Math.round((stats.no_show / stats.total_today) * 100)}%`
                  : '0%'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ icon, label, value, color }) => (
  <div className={`stat-card ${color ? `stat-${color}` : ''}`}>
    <div className="stat-icon">{icon}</div>
    <div><p className="stat-label">{label}</p><h2 className="stat-value">{value}</h2></div>
  </div>
);
