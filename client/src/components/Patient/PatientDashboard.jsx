import React, { useState, useEffect, useCallback } from 'react';
import { patientService, socket } from '../../services/api';
import { useAuth } from '../../App';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, Pill, CalendarPlus, Activity,
  ChevronRight, QrCode, User, Bell, Stethoscope, CheckCircle2
} from 'lucide-react';

const statusBadge = (s) => {
  if (['Waiting', 'confirmed'].includes(s)) return 'badge-warning';
  if (s === 'In-Consultation') return 'badge-success';
  if (['Completed', 'completed'].includes(s)) return 'badge-info';
  return 'badge-danger';
};

function smartArrival(waitMins) {
  if (waitMins == null || waitMins <= 0) return null;
  const arrive = new Date(Date.now() + waitMins * 60000);
  const buffer = new Date(arrive.getTime() + 10 * 60000);
  const fmt = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${fmt(arrive)} – ${fmt(buffer)}`;
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [queueInfo, setQueueInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [appts, presc] = await Promise.all([
        patientService.getAppointments(),
        patientService.getPrescriptions(),
      ]);
      setAppointments(appts);
      setPrescriptions(presc);

      // Find active appointment and fetch queue
      const active = appts.find(a => ['Waiting', 'confirmed', 'In-Consultation'].includes(a.status));
      if (active) {
        const doctors = await patientService.getDoctors();
        const doc = doctors.find(d => d.name === active.doctor_name);
        if (doc) {
          const qi = await patientService.getQueue(doc.doctor_id || doc._id).catch(() => null);
          setQueueInfo(qi ? { ...qi, doctorName: active.doctor_name, date: active.date, reason: active.reason_for_visit } : null);
        }
      } else {
        setQueueInfo(null);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    socket.emit('join_queue');
    socket.on('queue_updated', fetchAll);
    return () => socket.off('queue_updated', fetchAll);
  }, [fetchAll]);

  const upcoming = appointments.filter(a => ['Waiting', 'confirmed', 'In-Consultation'].includes(a.status));
  const completed = appointments.filter(a => ['Completed', 'completed'].includes(a.status));

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Hello, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-sub" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={13} />
            {time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            &nbsp;·&nbsp;<span className="live-clock">{time.toLocaleTimeString()}</span>
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/patient/book')}>
          <CalendarPlus size={16} /> Book Appointment
        </button>
      </div>

      {/* ── ACTIVE APPOINTMENT WORKFLOW CARD ── */}
      {queueInfo ? (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="workflow-card">
          <div className="wf-top">
            <div className="wf-status-pill">
              {queueInfo.is_my_turn ? '🔔 Your Turn!' : '⏳ In Queue'}
            </div>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {queueInfo.date} · Dr. {queueInfo.doctorName}
            </span>
          </div>

          <div className="wf-main">
            <div className="wf-token-block">
              <p className="wf-label">Your Token</p>
              <h1 className="wf-token">#{queueInfo.token_number || '—'}</h1>
            </div>
            <div className="wf-divider" />
            <div className="wf-info-grid">
              <div className="wf-info-item">
                <p className="wf-label">Now Serving</p>
                <p className="wf-val">#{queueInfo.current_serving_token !== 'None' ? queueInfo.current_serving_token : '—'}</p>
              </div>
              <div className="wf-info-item">
                <p className="wf-label">Ahead of You</p>
                <p className="wf-val">{queueInfo.patients_ahead ?? '—'}</p>
              </div>
              <div className="wf-info-item">
                <p className="wf-label">Est. Wait</p>
                <p className="wf-val">{queueInfo.estimated_wait_time_mins != null ? `${queueInfo.estimated_wait_time_mins} min` : '—'}</p>
              </div>
              <div className="wf-info-item">
                <p className="wf-label">Your Position</p>
                <p className="wf-val">#{queueInfo.queue_position || '—'}</p>
              </div>
            </div>
          </div>

          {smartArrival(queueInfo.estimated_wait_time_mins) && (
            <div className="wf-arrival">
              🕐 <strong>Suggested Arrival:</strong> {smartArrival(queueInfo.estimated_wait_time_mins)}
            </div>
          )}

          <div className="wf-reason">
            <Stethoscope size={14} /> {queueInfo.reason || 'General Consultation'}
          </div>

          <div className="wf-actions">
            <button className="btn btn-sm btn-white" onClick={() => navigate('/patient/queue')}>
              <Clock size={14} /> Live Queue
            </button>
            <button className="btn btn-sm btn-white" onClick={() => navigate('/patient/qr')}>
              <QrCode size={14} /> My QR
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="no-appt-banner">
          <CalendarPlus size={20} />
          <span>No active appointment. <strong>Book one now</strong> to get started.</span>
          <button className="btn btn-sm btn-primary" onClick={() => navigate('/patient/book')}>Book Now</button>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon={<Calendar size={20} />} label="Total Appointments" value={appointments.length} />
        <StatCard icon={<Clock size={20} />} label="Upcoming" value={upcoming.length} color="warning" />
        <StatCard icon={<CheckCircle2 size={20} />} label="Completed" value={completed.length} color="success" />
        <StatCard icon={<Pill size={20} />} label="Prescriptions" value={prescriptions.length} color="primary" />
      </div>

      {/* Quick Nav */}
      <div className="patient-quick-nav">
        {[
          { label: 'Book Appointment', icon: '📅', path: '/patient/book', color: '#2563eb' },
          { label: 'My Appointments', icon: '🗓️', path: '/patient/appointments', color: '#0891b2' },
          { label: 'Queue Status', icon: '⏱️', path: '/patient/queue', color: '#f59e0b' },
          { label: 'My QR Code', icon: '📲', path: '/patient/qr', color: '#7c3aed' },
          { label: 'Medical History', icon: '📋', path: '/patient/history', color: '#10b981' },
          { label: 'Prescriptions', icon: '💊', path: '/patient/prescriptions', color: '#dc2626' },
          { label: 'Profile', icon: '👤', path: '/patient/profile', color: '#64748b' },
        ].map(item => (
          <motion.button key={item.path} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
            className="pqn-btn" onClick={() => navigate(item.path)}>
            <span className="pqn-icon" style={{ background: item.color }}>{item.icon}</span>
            <span className="pqn-label">{item.label}</span>
            <ChevronRight size={14} className="text-muted" />
          </motion.button>
        ))}
      </div>

      <div className="two-col-grid">
        {/* Recent Appointments */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Calendar size={18} /> Recent Appointments</h3>
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/patient/appointments')}>
              View All <ChevronRight size={14} />
            </button>
          </div>
          {appointments.length === 0 ? (
            <div className="empty-state">
              <Calendar size={40} /><p>No appointments yet</p>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/patient/book')}>Book Now</button>
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Date</th><th>Doctor</th><th>Reason</th><th>Status</th></tr></thead>
              <tbody>
                {appointments.slice(0, 5).map(a => (
                  <tr key={a.id}>
                    <td className="fw-600">{a.date}</td>
                    <td>{a.doctor_name}</td>
                    <td className="text-muted text-sm">{a.reason_for_visit}</td>
                    <td><span className={`badge ${statusBadge(a.status)}`}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Prescriptions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Pill size={18} /> Recent Prescriptions</h3>
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/patient/prescriptions')}>
              View All <ChevronRight size={14} />
            </button>
          </div>
          {prescriptions.length === 0 ? (
            <div className="empty-state"><Pill size={40} /><p>No prescriptions yet</p></div>
          ) : (
            <div className="history-list">
              {prescriptions.slice(0, 4).map((p, i) => (
                <div key={i} className="history-item">
                  <div className="history-header">
                    <span className="fw-600">Dr. {p.doctor_name}</span>
                    <span className="text-muted text-xs">{p.date || new Date(p.created_at || p.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className="badge badge-info">{p.diagnosis?.split('\n')[0]?.replace('[A] ', '') || p.diagnosis}</span>
                  <div className="meds-list mt-1">
                    {p.medicines?.slice(0, 2).map((m, j) => <span key={j} className="med-tag">{m.name}</span>)}
                    {p.medicines?.length > 2 && <span className="text-muted text-xs">+{p.medicines.length - 2} more</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
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
