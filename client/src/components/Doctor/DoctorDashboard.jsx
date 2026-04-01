import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorService, socket } from '../../services/api';
import { useAuth } from '../../App';
import { motion } from 'framer-motion';
import {
  Activity, Users, Clock, AlertCircle, PhoneCall, CheckCircle2,
  Stethoscope, BarChart2, Bell, User, TrendingUp, Shield, Calendar, FileText
} from 'lucide-react';

const auditLog = (action) => {
  const logs = JSON.parse(sessionStorage.getItem('auditLogs') || '[]');
  logs.unshift({ action, time: new Date().toLocaleTimeString() });
  sessionStorage.setItem('auditLogs', JSON.stringify(logs.slice(0, 20)));
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

const StatCard = ({ icon, label, value, color }) => (
  <div className={`stat-card ${color ? `stat-${color}` : ''}`}>
    <div className="stat-icon">{icon}</div>
    <div><p className="stat-label">{label}</p><h2 className="stat-value">{value}</h2></div>
  </div>
);

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({ total_appointments: 0, patients_waiting: 0, emergency_count: 0, avg_consult_time: '10m' });
  const [activePatient, setActivePatient] = useState(null);
  const [nextPatient, setNextPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [cdssAlerts, setCdssAlerts] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [q, s] = await Promise.all([doctorService.getQueue(), doctorService.getStats()]);
      setQueue(q);
      setStats(s);
      const active = q.find(p => p.status === 'In-Consultation') || null;
      const waiting = q.filter(p => p.status === 'Waiting');
      setActivePatient(active);
      setNextPatient(waiting[0] || null);
      const alerts = [];
      q.forEach(p => {
        if (p.type === 'Emergency') alerts.push({ level: 'critical', msg: `${p.patient_name} — Emergency` });
        if (p.risk_level === 'High') alerts.push({ level: 'warning', msg: `${p.patient_name} — High Risk` });
      });
      setCdssAlerts(alerts.slice(0, 3));
      setRecentLogs(JSON.parse(sessionStorage.getItem('auditLogs') || '[]').slice(0, 5));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    socket.emit('join_queue');
    socket.on('queue_updated', fetchData);
    return () => socket.off('queue_updated', fetchData);
  }, [fetchData]);

  const callNext = async (id, name) => {
    await doctorService.callPatient(id);
    auditLog(`Called patient: ${name}`);
    fetchData();
  };

  const complete = async (id, name) => {
    await doctorService.completeConsultation(id);
    auditLog(`Completed: ${name}`);
    fetchData();
  };

  const smartWait = (pos) => pos > 0 ? `~${pos * 10} min` : 'Now';

  if (loading) return <div className="page-loading"><div className="spinner" /> Loading Dashboard...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Activity size={22} /> Good {getGreeting()}, Dr. {user?.name?.split(' ').pop()}</h1>
          <p className="page-sub" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={13} /> {time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            &nbsp;&nbsp;<Clock size={13} /> <span className="live-clock">{time.toLocaleTimeString()}</span>
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-danger" onClick={() => navigate('/doctor/queue')}>
            <AlertCircle size={16} /> Emergency
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/doctor/queue')}>
            <PhoneCall size={16} /> Queue
          </button>
        </div>
      </div>

      {cdssAlerts.length > 0 && (
        <div className="cdss-banner">
          <Shield size={15} /> <strong>CDSS:</strong>
          {cdssAlerts.map((a, i) => (
            <span key={i} className={`cdss-tag cdss-${a.level}`}>{a.msg}</span>
          ))}
        </div>
      )}

      <div className="stats-grid">
        <StatCard icon={<Users size={20} />} label="Total Today" value={stats.total_appointments} />
        <StatCard icon={<Clock size={20} />} label="Waiting" value={stats.patients_waiting} color="warning" />
        <StatCard icon={<AlertCircle size={20} />} label="Emergency" value={stats.emergency_count} color="danger" />
        <StatCard icon={<TrendingUp size={20} />} label="Avg. Consult" value={stats.avg_consult_time} color="success" />
      </div>

      <div className="dashboard-3col">
        {/* Current Patient */}
        <div className="card">
          <h3 className="card-title mb-3"><Stethoscope size={18} /> Current Patient</h3>
          {activePatient ? (
            <div className="current-patient-card">
              <div className="cp-avatar">{activePatient.patient_name?.charAt(0)}</div>
              <h4 className="fw-700 mt-2">{activePatient.patient_name}</h4>
              <span className="badge badge-success">Token #{activePatient.token_number}</span>
              <p className="text-muted text-sm mt-2">{activePatient.reason || 'General Checkup'}</p>
              <div className="vitals-mini mt-2">
                <span>BP: {activePatient.vitals?.bp || '120/80'}</span>
                <span>Temp: {activePatient.vitals?.temp || '98.6'}°F</span>
              </div>
              <div className="cp-actions mt-3">
                <button className="btn btn-sm btn-primary" onClick={() => navigate('/doctor/prescribe')}>
                  <FileText size={13} /> Prescribe
                </button>
                <button className="btn btn-sm btn-success" onClick={() => complete(activePatient.id, activePatient.patient_name)}>
                  <CheckCircle2 size={13} /> Complete
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state"><Stethoscope size={36} /><p>No active patient</p></div>
          )}
        </div>

        {/* Next Patient */}
        <div className="card">
          <h3 className="card-title mb-3"><User size={18} /> Next Patient</h3>
          {nextPatient ? (
            <div className="next-patient-card">
              <div className="np-avatar">{nextPatient.patient_name?.charAt(0)}</div>
              <h4 className="fw-700 mt-2">{nextPatient.patient_name}</h4>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                <span className="badge badge-warning">Token #{nextPatient.token_number}</span>
                {nextPatient.type === 'Emergency' && <span className="badge badge-danger">URGENT</span>}
              </div>
              <p className="text-muted text-sm mt-2">{nextPatient.reason || 'General Checkup'}</p>
              <p className="smart-wait mt-2"><Clock size={12} /> Est. wait: {smartWait(0)}</p>
              <button className="btn btn-primary w-full mt-3" onClick={() => callNext(nextPatient.id, nextPatient.patient_name)}>
                <PhoneCall size={14} /> Call Now
              </button>
            </div>
          ) : (
            <div className="empty-state"><User size={36} /><p>No patients waiting</p></div>
          )}
        </div>

        {/* Queue + Audit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 className="card-title mb-3"><Users size={18} /> Queue Overview</h3>
            <div className="queue-mini-list">
              {queue.slice(0, 4).map((p, i) => (
                <div key={p.id} className="queue-mini-item">
                  <span className="qm-token">#{p.token_number}</span>
                  <span className="qm-name">{p.patient_name}</span>
                  <span className="text-muted text-xs">{smartWait(i)}</span>
                  <span className={`badge ${p.type === 'Emergency' ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: 10 }}>{p.type}</span>
                </div>
              ))}
              {queue.length === 0 && <p className="text-muted text-sm" style={{ textAlign: 'center', padding: '8px 0' }}>Queue is empty</p>}
            </div>
            <button className="btn btn-outline w-full mt-2" onClick={() => navigate('/doctor/queue')}>
              View Full Queue →
            </button>
          </div>

          <div className="card">
            <h3 className="card-title mb-3"><Shield size={18} /> Audit Log</h3>
            <div className="audit-list">
              {recentLogs.length === 0 && <p className="text-muted text-xs">No actions yet.</p>}
              {recentLogs.map((l, i) => (
                <div key={i} className="audit-item">
                  <span className="audit-dot" />
                  <span className="text-sm">{l.action}</span>
                  <span className="text-muted text-xs" style={{ marginLeft: 'auto' }}>{l.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Nav */}
      <div className="quick-nav-grid">
        {[
          { label: 'Queue', icon: <Users size={20} />, path: '/doctor/queue', color: '#2563eb' },
          { label: 'Prescribe', icon: <FileText size={20} />, path: '/doctor/prescribe', color: '#7c3aed' },
          { label: 'History', icon: <Stethoscope size={20} />, path: '/doctor/history', color: '#0891b2' },
          { label: 'Reports', icon: <BarChart2 size={20} />, path: '/doctor/performance', color: '#10b981' },
          { label: 'Notifications', icon: <Bell size={20} />, path: '/doctor/notifications', color: '#f59e0b' },
          { label: 'Profile', icon: <User size={20} />, path: '/doctor/profile', color: '#dc2626' },
        ].map(item => (
          <motion.button key={item.path} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            className="quick-nav-btn" onClick={() => navigate(item.path)}>
            <span className="qn-icon" style={{ background: item.color }}>{item.icon}</span>
            <span>{item.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
