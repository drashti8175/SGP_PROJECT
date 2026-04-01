import React, { useState, useEffect } from 'react';
import { receptionistService } from '../../services/api';
import { BarChart2, TrendingUp, XCircle, CreditCard, Clock, Users, RefreshCw } from 'lucide-react';

export default function ReceptionistReports() {
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    Promise.all([receptionistService.getAnalytics(), receptionistService.getDashboardStats()])
      .then(([a, s]) => { setData(a); setStats(s); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  const maxCount = Math.max(...(data?.last7Days?.map(d => d.count) || [1]), 1);
  const showRate = stats?.total_today > 0
    ? Math.round(((stats.total_today - stats.no_show) / stats.total_today) * 100)
    : 100;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><BarChart2 size={22} /> Reports & Analytics</h1>
          <p className="page-sub">Daily appointment summary and performance metrics</p>
        </div>
        <button className="btn btn-outline" onClick={fetchData}><RefreshCw size={15} /> Refresh</button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon={<Users size={20} />}      label="Total Today"    value={stats?.total_today || 0} />
        <StatCard icon={<Clock size={20} />}       label="Waiting"        value={stats?.waiting || 0}     color="warning" />
        <StatCard icon={<XCircle size={20} />}     label="No-Shows"       value={stats?.no_show || 0}     color="danger" />
        <StatCard icon={<TrendingUp size={20} />}  label="Show Rate"      value={`${showRate}%`}          color="success" />
        <StatCard icon={<CreditCard size={20} />}  label="Paid"           value={data?.total_paid || 0}   color="primary" />
        <StatCard icon={<BarChart2 size={20} />}   label="Completed"      value={stats?.completed || 0}   color="success" />
      </div>

      <div className="two-col-grid">
        {/* 7-day bar chart */}
        <div className="card">
          <h3 className="card-title mb-4">📊 Appointments — Last 7 Days</h3>
          <div className="bar-chart" style={{ height: 160 }}>
            {data?.last7Days?.map((d, i) => (
              <div key={i} className="bar-col">
                <div className="bar-fill" style={{ height: `${(d.count / maxCount) * 100}%`, background: 'var(--primary)', minHeight: d.count > 0 ? 4 : 0 }}>
                  {d.count > 0 && <span className="bar-val">{d.count}</span>}
                </div>
                <span className="bar-label">
                  {new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Today Summary */}
        <div className="card">
          <h3 className="card-title mb-4">📋 Today's Summary</h3>
          <div className="quick-stats">
            <div className="quick-stat-item">
              <span className="text-muted">Total Appointments</span>
              <span className="fw-700">{stats?.total_today || 0}</span>
            </div>
            <div className="quick-stat-item">
              <span className="text-muted">Pending Approval</span>
              <span className="fw-700 text-warning">{stats?.pending || 0}</span>
            </div>
            <div className="quick-stat-item">
              <span className="text-muted">Currently Waiting</span>
              <span className="fw-700 text-primary">{stats?.waiting || 0}</span>
            </div>
            <div className="quick-stat-item">
              <span className="text-muted">In Consultation</span>
              <span className="fw-700 text-success">{stats?.in_consultation || 0}</span>
            </div>
            <div className="quick-stat-item">
              <span className="text-muted">Completed</span>
              <span className="fw-700">{stats?.completed || 0}</span>
            </div>
            <div className="quick-stat-item">
              <span className="text-muted">No-Shows / Rejected</span>
              <span className="fw-700 text-danger">{stats?.no_show || 0}</span>
            </div>
            <div className="quick-stat-item">
              <span className="text-muted">Emergency Cases</span>
              <span className="fw-700 text-danger">{stats?.emergency || 0}</span>
            </div>
            <div className="quick-stat-item">
              <span className="text-muted">Avg. Wait Time</span>
              <span className="fw-700">~{(stats?.waiting || 0) * 10} min</span>
            </div>
            <div className="quick-stat-item">
              <span className="text-muted">Show Rate</span>
              <span className={`fw-700 ${showRate >= 80 ? 'text-success' : 'text-warning'}`}>{showRate}%</span>
            </div>
            <div className="quick-stat-item">
              <span className="text-muted">Revenue Collected</span>
              <span className="fw-700 text-success">₹{(data?.total_paid || 0) * 300}</span>
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
