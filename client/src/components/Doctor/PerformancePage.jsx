import React, { useState, useEffect } from 'react';
import { doctorService } from '../../services/api';
import { BarChart2, TrendingUp, Users, Clock } from 'lucide-react';

export default function PerformancePage() {
  const [data, setData] = useState(null);

  useEffect(() => { doctorService.getPerformance().then(setData).catch(console.error); }, []);

  if (!data) return <div className="page-loading">Loading performance data...</div>;

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxPatients = Math.max(...(data.dailyPatients || [1]));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><BarChart2 size={22} /> Performance Analytics</h1>
          <p className="page-sub">Weekly overview of your clinical performance</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={<Users size={20} />} label="Total Handled" value={data.total_handled || 0} />
        <StatCard icon={<TrendingUp size={20} />} label="Satisfaction" value={`${data.satisfaction || 0}/5 ⭐`} />
        <StatCard icon={<Clock size={20} />} label="Avg Consult" value={`${data.avgConsultTime?.[0] || 0} min`} />
        <StatCard icon={<BarChart2 size={20} />} label="Peak Hour" value="10:00 AM" />
      </div>

      <div className="two-col-grid">
        <div className="card">
          <h3 className="card-title mb-4">Daily Patients (This Week)</h3>
          <div className="bar-chart">
            {(data.dailyPatients || []).map((val, i) => (
              <div key={i} className="bar-col">
                <div className="bar-fill" style={{ height: `${(val / maxPatients) * 100}%` }}>
                  <span className="bar-val">{val}</span>
                </div>
                <span className="bar-label">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title mb-4">Peak Hours</h3>
          <div className="peak-list">
            {Object.entries(data.peakHours || {}).map(([hour, count]) => (
              <div key={hour} className="peak-row">
                <span className="fw-600">{hour}</span>
                <div className="peak-bar-wrap">
                  <div className="peak-bar" style={{ width: `${(count / 15) * 100}%` }} />
                </div>
                <span className="text-muted text-sm">{count} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ icon, label, value }) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div><p className="stat-label">{label}</p><h2 className="stat-value">{value}</h2></div>
  </div>
);
