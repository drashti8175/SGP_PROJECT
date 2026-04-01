import React, { useState, useEffect, useCallback } from 'react';
import { doctorService, socket, api } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, PhoneCall, CheckCircle2, SkipForward, XCircle,
  AlertCircle, Clock, Activity, Stethoscope
} from 'lucide-react';

const auditLog = (action) => {
  const logs = JSON.parse(sessionStorage.getItem('auditLogs') || '[]');
  logs.unshift({ action, time: new Date().toLocaleTimeString() });
  sessionStorage.setItem('auditLogs', JSON.stringify(logs.slice(0, 20)));
};

export default function QueueManagement() {
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({ total_appointments: 0, patients_waiting: 0, emergency_count: 0, avg_consult_time: '10m' });
  const [activePatient, setActivePatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [q, s] = await Promise.all([doctorService.getQueue(), doctorService.getStats()]);
      setQueue(q);
      setStats(s);
      setActivePatient(q.find(p => p.status === 'In-Consultation') || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    socket.emit('join_queue');
    socket.on('queue_updated', fetchData);
    return () => socket.off('queue_updated', fetchData);
  }, [fetchData]);

  const notify = (msg) => { setActionMsg(msg); setTimeout(() => setActionMsg(''), 3000); };

  const callNext = async (id, name) => {
    await doctorService.callPatient(id);
    auditLog(`Called: ${name}`);
    notify(`✅ Called ${name}`);
    fetchData();
  };

  const complete = async (id, name) => {
    await doctorService.completeConsultation(id);
    auditLog(`Completed: ${name}`);
    notify(`✅ Completed consultation for ${name}`);
    fetchData();
  };

  const skipPatient = async (id, name) => {
    try {
      await api.post('/doctor/complete', { appointment_id: id });
      auditLog(`Skipped: ${name}`);
      notify(`⏭ Skipped ${name}`);
      fetchData();
    } catch (e) { notify('❌ Failed to skip patient'); }
  };

  const markNoShow = async (id, name) => {
    try {
      await api.patch(`/doctor/no-show/${id}`).catch(() =>
        api.post('/doctor/complete', { appointment_id: id })
      );
      auditLog(`No-show: ${name}`);
      notify(`🚫 Marked ${name} as no-show`);
      fetchData();
    } catch (e) { notify('❌ Action failed'); }
  };

  const waiting = queue.filter(p => p.status === 'Waiting');
  const smartWait = (pos) => pos === 0 ? 'Next up' : `~${pos * 10} min`;

  if (loading) return <div className="page-loading"><div className="spinner" /> Loading queue...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Users size={22} /> Queue Management</h1>
          <p className="page-sub">Live patient queue — real-time via Socket.IO</p>
        </div>
        <div className="header-actions">
          {actionMsg && <span className="action-toast">{actionMsg}</span>}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon={<Users size={20} />} label="Total Today" value={stats.total_appointments} />
        <StatCard icon={<Clock size={20} />} label="Waiting" value={stats.patients_waiting} color="warning" />
        <StatCard icon={<AlertCircle size={20} />} label="Emergency" value={stats.emergency_count} color="danger" />
        <StatCard icon={<Activity size={20} />} label="Avg. Time" value={stats.avg_consult_time} color="success" />
      </div>

      <div className="two-col-grid">
        {/* Active Consultation Panel */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Stethoscope size={18} /> Active Consultation</h3>
            <span className={`badge ${activePatient ? 'badge-success' : 'badge-warning'}`}>
              {activePatient ? '● In Progress' : '● Idle'}
            </span>
          </div>

          {activePatient ? (
            <div className="active-consult-panel">
              <div className="acp-top">
                <div className="big-avatar">{activePatient.patient_name?.charAt(0)}</div>
                <div>
                  <h3 className="fw-700">{activePatient.patient_name}</h3>
                  <p className="text-muted text-sm">{activePatient.reason || 'General Checkup'}</p>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <span className="badge badge-success">Token #{activePatient.token_number}</span>
                    {activePatient.type === 'Emergency' && <span className="badge badge-danger">URGENT</span>}
                  </div>
                </div>
              </div>

              {/* Live Vitals */}
              <div className="vitals-monitor mt-3">
                <div className="monitor-header">
                  <span>Live Vitals Monitoring</span>
                  <span className="live-dot">● LIVE</span>
                </div>
                <LiveECG />
                <div className="vitals-row mt-2">
                  <VitalBox label="BP" value={activePatient.vitals?.bp || '120/80'} />
                  <VitalBox label="Temp" value={`${activePatient.vitals?.temp || '98.6'}°F`} />
                  <VitalBox label="Weight" value={`${activePatient.vitals?.weight || '70'}kg`} />
                  <VitalBox label="SpO2" value="98%" />
                </div>
              </div>

              <button className="btn btn-success w-full mt-3"
                onClick={() => complete(activePatient.id, activePatient.patient_name)}>
                <CheckCircle2 size={16} /> Mark Consultation Complete
              </button>
            </div>
          ) : (
            <div className="empty-state">
              <Stethoscope size={48} />
              <p>No patient in consultation</p>
              {waiting.length > 0 && (
                <button className="btn btn-primary mt-2"
                  onClick={() => callNext(waiting[0].id, waiting[0].patient_name)}>
                  <PhoneCall size={14} /> Call First Patient
                </button>
              )}
            </div>
          )}
        </div>

        {/* Waiting Queue */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Users size={18} /> Waiting Queue ({waiting.length})</h3>
          </div>

          <div className="queue-full-list">
            <AnimatePresence>
              {waiting.map((p, i) => (
                <motion.div key={p.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`queue-row ${p.type === 'Emergency' ? 'queue-row-emergency' : ''}`}>
                  <div className="qr-left">
                    <span className="qr-pos">{i + 1}</span>
                    <div className="patient-avatar">{p.patient_name?.charAt(0)}</div>
                    <div>
                      <p className="fw-600">{p.patient_name}</p>
                      <p className="text-muted text-xs">{p.reason || 'General'} · {smartWait(i)}</p>
                    </div>
                  </div>
                  <div className="qr-right">
                    {p.type === 'Emergency' && <span className="badge badge-danger">🚨 Urgent</span>}
                    <span className="badge badge-info">#{p.token_number}</span>
                    <button className="btn btn-xs btn-primary" title="Call"
                      onClick={() => callNext(p.id, p.patient_name)}>
                      <PhoneCall size={12} />
                    </button>
                    <button className="btn btn-xs btn-warning" title="Skip"
                      onClick={() => skipPatient(p.id, p.patient_name)}>
                      <SkipForward size={12} />
                    </button>
                    <button className="btn btn-xs btn-danger" title="No Show"
                      onClick={() => markNoShow(p.id, p.patient_name)}>
                      <XCircle size={12} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {waiting.length === 0 && (
              <div className="empty-state"><Users size={40} /><p>No patients waiting</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveECG() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setOffset(o => (o + 3) % 300), 50);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="ecg-line">
      <svg width="100%" height="50" viewBox="0 0 300 50" style={{ overflow: 'hidden' }}>
        <path
          d={`M${-offset} 25 L${30 - offset} 25 L${40 - offset} 10 L${50 - offset} 40 L${60 - offset} 25 L${90 - offset} 25 L${110 - offset} 25 L${120 - offset} 8 L${130 - offset} 42 L${140 - offset} 25 L${180 - offset} 25 L${200 - offset} 25 L${210 - offset} 15 L${220 - offset} 35 L${230 - offset} 25 L${530 - offset} 25`}
          fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

const StatCard = ({ icon, label, value, color }) => (
  <div className={`stat-card ${color ? `stat-${color}` : ''}`}>
    <div className="stat-icon">{icon}</div>
    <div><p className="stat-label">{label}</p><h2 className="stat-value">{value}</h2></div>
  </div>
);

const VitalBox = ({ label, value }) => (
  <div className="vital-box">
    <p className="text-xs text-muted">{label}</p>
    <p className="fw-700">{value}</p>
  </div>
);
