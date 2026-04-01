import React, { useState, useEffect, useCallback } from 'react';
import { receptionistService, socket } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserCheck, CheckCircle2, XCircle, CreditCard,
  RefreshCw, AlertCircle, Clock, SkipForward, PhoneCall,
  Activity, Bell
} from 'lucide-react';

const statusBadge = s => {
  if (s === 'pending')         return { cls: 'badge-pending',  label: '⏳ Pending' };
  if (s === 'confirmed')       return { cls: 'badge-success',  label: '✅ Approved' };
  if (s === 'Waiting')         return { cls: 'badge-warning',  label: '⏱ Waiting' };
  if (s === 'In-Consultation') return { cls: 'badge-info',     label: '🩺 Consulting' };
  if (['Completed','completed'].includes(s)) return { cls: 'badge-info', label: '✔ Done' };
  if (['Cancelled','cancelled'].includes(s)) return { cls: 'badge-danger', label: '❌ Rejected' };
  return { cls: 'badge-warning', label: s };
};

export default function QueueManager() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState('');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchData = useCallback(() => {
    receptionistService.getRequests()
      .then(setAppointments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
    socket.emit('join_queue');
    socket.on('queue_updated', fetchData);
    socket.on('appointment_updated', fetchData);
    return () => { socket.off('queue_updated', fetchData); socket.off('appointment_updated', fetchData); };
  }, [fetchData]);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const checkIn  = async (id, name) => { await receptionistService.checkIn(id); notify(`✅ ${name} checked in`); fetchData(); };
  const markPaid = async (id, name, fee) => {
    if (!window.confirm(`Collect ₹${fee || 300} from ${name}?`)) return;
    await receptionistService.updatePayment(id, 'paid');
    notify(`✅ Payment collected from ${name}`);
    fetchData();
  };
  const cancel   = async (id, name) => {
    if (!window.confirm(`Cancel appointment for ${name}?`)) return;
    await receptionistService.updateStatus(id, 'cancelled');
    notify(`🚫 ${name}'s appointment cancelled`);
    fetchData();
  };

  // Smart estimated arrival window
  const getArrivalWindow = (pos) => {
    if (pos <= 0) return 'Now';
    const now = new Date();
    const arrive = new Date(now.getTime() + pos * 10 * 60000);
    const end    = new Date(arrive.getTime() + 10 * 60000);
    const fmt = d => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${fmt(arrive)} – ${fmt(end)}`;
  };

  const tabs = [
    { key: 'all',       label: 'All',         count: appointments.length },
    { key: 'pending',   label: 'Pending',      count: appointments.filter(a => a.status === 'pending').length },
    { key: 'confirmed', label: 'Approved',     count: appointments.filter(a => a.status === 'confirmed').length },
    { key: 'Waiting',   label: 'In Queue',     count: appointments.filter(a => a.status === 'Waiting').length },
    { key: 'In-Consultation', label: 'Consulting', count: appointments.filter(a => a.status === 'In-Consultation').length },
    { key: 'completed', label: 'Done',         count: appointments.filter(a => ['Completed','completed'].includes(a.status)).length },
  ];

  const filtered = filter === 'all' ? appointments
    : filter === 'completed' ? appointments.filter(a => ['Completed','completed'].includes(a.status))
    : appointments.filter(a => a.status === filter);

  // Queue position for waiting patients
  const waitingQueue = appointments.filter(a => a.status === 'Waiting');

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Users size={22} /> Queue Manager</h1>
          <p className="page-sub">
            {appointments.length} total · {waitingQueue.length} in queue ·
            <span className="live-clock" style={{ marginLeft: 6 }}>{time.toLocaleTimeString()}</span>
          </p>
        </div>
        <div className="header-actions">
          {toast && <span className="action-toast">{toast}</span>}
          <button className="btn btn-outline" onClick={fetchData}><RefreshCw size={15} /> Refresh</button>
        </div>
      </div>

      {/* Emergency Alert */}
      {appointments.some(a => a.type === 'Emergency' && ['pending','confirmed','Waiting'].includes(a.status)) && (
        <div className="cdss-banner" style={{ background: '#fee2e2', borderColor: '#fca5a5' }}>
          <AlertCircle size={16} style={{ color: '#dc2626' }} />
          <strong style={{ color: '#dc2626' }}>🚨 Emergency patient in queue — handle immediately!</strong>
        </div>
      )}

      {/* Live Queue Summary */}
      {waitingQueue.length > 0 && (
        <div className="queue-live-summary">
          <div className="qls-header">
            <Activity size={16} /> <span className="fw-700">Live Queue Status</span>
            <span className="badge badge-success" style={{ marginLeft: 8 }}>● Real-time</span>
          </div>
          <div className="qls-tokens">
            {waitingQueue.slice(0, 6).map((p, i) => (
              <div key={p.id} className={`qls-token ${i === 0 ? 'qls-token-first' : ''}`}>
                <span className="qls-num">#{p.token_number}</span>
                <span className="qls-name">{p.patient_name?.split(' ')[0]}</span>
                <span className="qls-time text-xs text-muted">{getArrivalWindow(i)}</span>
              </div>
            ))}
            {waitingQueue.length > 6 && (
              <div className="qls-token">
                <span className="text-muted text-sm">+{waitingQueue.length - 6} more</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {tabs.map(t => (
          <button key={t.key} className={`filter-tab ${filter === t.key ? 'active' : ''}`}
            onClick={() => setFilter(t.key)}>
            {t.label}
            <span style={{ marginLeft: 5, background: filter === t.key ? 'rgba(255,255,255,0.3)' : 'var(--border)', borderRadius: 999, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state"><Users size={48} /><p>No appointments in this category</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Token</th><th>Patient</th><th>Doctor</th><th>Reason</th>
                  <th>Type</th><th>Status</th><th>Est. Arrival</th><th>Payment</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map(a => {
                    const sb = statusBadge(a.status);
                    const qPos = waitingQueue.findIndex(w => w.id === a.id);
                    return (
                      <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className={`${a.type === 'Emergency' ? 'row-emergency' : ''} ${a.status === 'In-Consultation' ? 'row-active' : ''} ${a.status === 'pending' ? 'row-pending' : ''}`}>
                        <td><span className="token-num">#{a.token_number}</span></td>
                        <td>
                          <p className="fw-600">{a.patient_name}</p>
                          <p className="text-muted text-xs">{a.patient_email}</p>
                          {a.patient_phone && <p className="text-muted text-xs">{a.patient_phone}</p>}
                        </td>
                        <td className="fw-500">{a.doctor_name}</td>
                        <td className="text-muted text-sm" style={{ maxWidth: 140 }}>{a.reason_for_visit}</td>
                        <td><span className={`badge ${a.type === 'Emergency' ? 'badge-danger' : 'badge-info'}`}>{a.type || 'Normal'}</span></td>
                        <td><span className={`badge ${sb.cls}`}>{sb.label}</span></td>
                        <td className="text-muted text-sm">
                          {a.status === 'Waiting' && qPos >= 0 ? (
                            <span style={{ color: '#0891b2', fontWeight: 600 }}>{getArrivalWindow(qPos)}</span>
                          ) : '—'}
                        </td>
                        <td>
                          <span className={`badge ${a.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                            {a.payment_status === 'paid' ? '✅ Paid' : '⏳ Unpaid'}
                          </span>
                        </td>
                        <td>
                          <div className="action-btns">
                            {a.status === 'confirmed' && (
                              <button className="btn btn-xs btn-primary" title="Check In Patient"
                                onClick={() => checkIn(a.id, a.patient_name)}>
                                <UserCheck size={12} /> Check In
                              </button>
                            )}
                            {a.payment_status !== 'paid' && ['Waiting','confirmed','In-Consultation','Completed','completed'].includes(a.status) && (
                              <button className="btn btn-xs btn-warning" title="Collect Payment"
                                onClick={() => markPaid(a.id, a.patient_name, a.consultation_fee)}>
                                <CreditCard size={12} /> Pay
                              </button>
                            )}
                            {!['Completed','completed','Cancelled','cancelled'].includes(a.status) && (
                              <button className="btn btn-xs btn-danger" title="Cancel"
                                onClick={() => cancel(a.id, a.patient_name)}>
                                <XCircle size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
