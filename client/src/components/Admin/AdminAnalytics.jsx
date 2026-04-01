import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { BarChart2, TrendingUp, Users, XCircle, DollarSign } from 'lucide-react';

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminService.getAnalytics(), adminService.getStats()])
      .then(([a, s]) => { setData(a); setStats(s); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  const maxCount = Math.max(...(data?.last30?.map(d => d.total) || [1]), 1);
  const maxDoc = Math.max(...(data?.doctorLoad?.map(d => d.count) || [1]), 1);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><BarChart2 size={22} /> Reports & Analytics</h1>
          <p className="page-sub">30-day overview and performance metrics</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={<TrendingUp size={20} />} label="This Week" value={stats?.total_week || 0} color="primary" />
        <StatCard icon={<XCircle size={20} />} label="No-Shows Today" value={stats?.no_show || 0} color="danger" />
        <StatCard icon={<Users size={20} />} label="Total Patients" value={stats?.total_patients || 0} />
        <StatCard icon={<DollarSign size={20} />} label="Total Revenue" value={`₹${(stats?.total_revenue || 0).toLocaleString()}`} color="success" />
      </div>

      <div className="two-col-grid">
        {/* 30-day chart */}
        <div className="card">
          <h3 className="card-title mb-4">Appointments — Last 30 Days</h3>
          <div className="bar-chart" style={{ height: 160, gap: 3 }}>
            {data?.last30?.map((d, i) => (
              <div key={i} className="bar-col" style={{ flex: 1 }}>
                <div className="bar-fill" style={{
                  height: `${(d.total / maxCount) * 100}%`,
                  background: d.noshow > 0 ? 'var(--warning)' : 'var(--primary)',
                  minHeight: d.total > 0 ? 4 : 0
                }} />
                {i % 7 === 0 && <span className="bar-label" style={{ fontSize: 9 }}>
                  {new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 12, height: 12, background: 'var(--primary)', borderRadius: 2, display: 'inline-block' }} /> Normal
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 12, height: 12, background: 'var(--warning)', borderRadius: 2, display: 'inline-block' }} /> Has No-shows
            </span>
          </div>
        </div>

        {/* Doctor Load */}
        <div className="card">
          <h3 className="card-title mb-4">Doctor-wise Patient Load</h3>
          <div className="peak-list">
            {data?.doctorLoad?.map((d, i) => (
              <div key={i} className="peak-row">
                <span className="fw-600" style={{ minWidth: 120 }}>{d.name}</span>
                <div className="peak-bar-wrap">
                  <div className="peak-bar" style={{ width: `${(d.count / maxDoc) * 100}%`, background: 'var(--primary)' }} />
                </div>
                <span className="text-muted text-sm">{d.count} pts</span>
              </div>
            ))}
            {(!data?.doctorLoad?.length) && <p className="text-muted text-sm">No data yet</p>}
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="card">
        <h3 className="card-title mb-4">Weekly Summary</h3>
        <table className="data-table">
          <thead><tr><th>Date</th><th>Total</th><th>No-Shows</th><th>Paid</th><th>Show Rate</th></tr></thead>
          <tbody>
            {data?.last30?.slice(-7).reverse().map((d, i) => (
              <tr key={i}>
                <td className="fw-600">{new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                <td>{d.total}</td>
                <td className={d.noshow > 0 ? 'text-danger fw-600' : 'text-muted'}>{d.noshow}</td>
                <td className="text-success fw-600">{d.paid}</td>
                <td>
                  <span className={`badge ${d.total > 0 && (d.total - d.noshow) / d.total > 0.8 ? 'badge-success' : 'badge-warning'}`}>
                    {d.total > 0 ? `${Math.round(((d.total - d.noshow) / d.total) * 100)}%` : 'N/A'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
