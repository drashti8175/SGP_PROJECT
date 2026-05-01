import React, { useState, useEffect } from 'react';
import { patientService, socket } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

const AVG_CONSULT_MINS = 10;

const WORKFLOW_STEPS = [
  { key: 'booked',     label: 'Appointment Booked',       icon: '📋', desc: 'Your appointment request has been submitted.' },
  { key: 'approved',   label: 'Approved by Receptionist', icon: '✅', desc: 'Receptionist has verified and approved your appointment.' },
  { key: 'checkedin',  label: 'Checked In at Clinic',     icon: '🏥', desc: 'You have been checked in and added to the doctor\'s queue.' },
  { key: 'consulting', label: 'In Consultation',          icon: '🩺', desc: 'Doctor is currently consulting with you.' },
  { key: 'completed',  label: 'Consultation Completed',   icon: '💊', desc: 'Consultation done. Check your prescriptions.' },
];

const getWorkflowStep = (status) => {
  if (['Cancelled','cancelled'].includes(status)) return -1;
  if (status === 'pending') return 0;
  if (status === 'confirmed') return 1;
  if (status === 'Waiting') return 2;
  if (status === 'In-Consultation') return 3;
  if (['Completed','completed'].includes(status)) return 4;
  return 0;
};

const statusConfig = {
  'pending':         { color: 'badge-pending',  icon: <Clock size={12} />,        label: '⏳ Pending Approval' },
  'Waiting':         { color: 'badge-warning',  icon: <Clock size={12} />,        label: '⏱ Waiting in Queue' },
  'confirmed':       { color: 'badge-success',  icon: <CheckCircle2 size={12} />, label: '✅ Approved' },
  'In-Consultation': { color: 'badge-info',     icon: <AlertCircle size={12} />,  label: '🩺 In Consultation' },
  'Completed':       { color: 'badge-success',  icon: <CheckCircle2 size={12} />, label: '✔ Completed' },
  'completed':       { color: 'badge-success',  icon: <CheckCircle2 size={12} />, label: '✔ Completed' },
  'Cancelled':       { color: 'badge-danger',   icon: <XCircle size={12} />,      label: '❌ Cancelled' },
  'cancelled':       { color: 'badge-danger',   icon: <XCircle size={12} />,      label: '❌ Cancelled' },
};

const canCancel = (status) => ['pending', 'confirmed', 'Waiting'].includes(status);

function WaitingTimeCard({ appointment }) {
  const [queueInfo, setQueueInfo] = useState(null);

  useEffect(() => {
    if (!['Waiting', 'confirmed', 'In-Consultation'].includes(appointment.status)) return;
    patientService.getDoctors().then(doctors => {
      const doc = doctors.find(d => d.name === appointment.doctor_name);
      if (doc) patientService.getQueue(doc.doctor_id || doc._id).then(setQueueInfo).catch(() => {});
    }).catch(() => {});
  }, [appointment]);

  if (!queueInfo) return null;

  const ahead = queueInfo.patients_ahead ?? 0;
  const waitMins = ahead * AVG_CONSULT_MINS;
  const expectedTime = new Date(Date.now() + waitMins * 60000);
  const arrivalFrom = new Date(expectedTime.getTime() - 10 * 60000);
  const fmt = d => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const waitColor = waitMins <= 20 ? '#10b981' : waitMins <= 40 ? '#f59e0b' : '#ef4444';
  const waitLabel = waitMins <= 20 ? 'Low Wait' : waitMins <= 40 ? 'Medium Wait' : 'High Wait';

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
      border: `2px solid ${waitColor}`,
      borderRadius: 12, padding: '14px 16px', marginTop: 12
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>⏳</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Estimated Waiting Time</span>
        <span style={{
          marginLeft: 'auto', background: waitColor, color: 'white',
          borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600
        }}>{waitLabel}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
        {[
          { label: 'Your Token', value: `#${appointment.token_number || queueInfo.token_number || '—'}` },
          { label: 'Now Serving', value: `#${queueInfo.current_serving_token !== 'None' ? queueInfo.current_serving_token : '—'}` },
          { label: 'Patients Ahead', value: ahead },
        ].map(item => (
          <div key={item.label} style={{ background: 'white', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>{item.label}</p>
            <p style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: 'white', borderRadius: 8, padding: '8px 10px' }}>
          <p style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>⏱ Est. Wait Time</p>
          <p style={{ fontWeight: 700, fontSize: 15, color: waitColor }}>{waitMins} minutes</p>
        </div>
        <div style={{ background: 'white', borderRadius: 8, padding: '8px 10px' }}>
          <p style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>🕐 Expected At</p>
          <p style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{fmt(expectedTime)}</p>
        </div>
      </div>

      <div style={{
        marginTop: 10, background: '#fef3c7', borderRadius: 8,
        padding: '8px 12px', fontSize: 12, color: '#92400e'
      }}>
        📍 <strong>Suggested Arrival:</strong> {fmt(arrivalFrom)} – {fmt(expectedTime)}
      </div>
    </div>
  );
}

function CancelModal({ appointment, onConfirm, onClose, loading }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20
    }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: 'white', borderRadius: 16, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: '#fee2e2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <Trash2 size={24} color="#ef4444" />
          </div>
          <h3 style={{ fontWeight: 700, fontSize: 18, color: '#0f172a', marginBottom: 6 }}>Cancel Appointment?</h3>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            Are you sure you want to cancel your appointment with <strong>{appointment.doctor_name}</strong> on <strong>{appointment.date}</strong>?
          </p>
          <p style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>This action cannot be undone.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} disabled={loading}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8, border: '1.5px solid #e2e8f0',
              background: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 14
            }}>
            Keep Appointment
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
              background: loading ? '#fca5a5' : '#ef4444', color: 'white',
              fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14,
              transition: 'background 0.2s'
            }}>
            {loading ? 'Cancelling...' : 'Yes, Cancel'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function MyAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState({});
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchData = () => {
    patientService.getAppointments()
      .then(setAppointments)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    socket.emit('join_queue');
    socket.on('appointment_updated', fetchData);
    socket.on('queue_updated', fetchData);
    return () => { socket.off('appointment_updated', fetchData); socket.off('queue_updated', fetchData); };
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    const apptId = cancelTarget.id || cancelTarget._id;
    if (!apptId) {
      showToast('Invalid appointment ID.', 'error');
      return;
    }
    setCancelling(true);
    try {
      await patientService.cancelAppointment(apptId);
      // Optimistically update state immediately
      setAppointments(prev =>
        prev.map(a => (a.id === apptId || a._id === apptId) ? { ...a, status: 'Cancelled' } : a)
      );
      setCancelTarget(null);
      setFilter('cancelled');
      showToast('✅ Appointment cancelled successfully.');
      fetchData();
    } catch (err) {
      console.log('Cancel error:', err.response?.data || err.message);
      showToast(err.response?.data?.error || 'Failed to cancel. Make sure backend is running.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const filters = ['all', 'pending', 'active', 'completed', 'cancelled'];
  const filtered = appointments.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'pending') return a.status === 'pending';
    if (filter === 'active') return ['Waiting','confirmed','In-Consultation'].includes(a.status);
    if (filter === 'completed') return ['Completed','completed'].includes(a.status);
    if (filter === 'cancelled') return ['Cancelled','cancelled'].includes(a.status);
    return true;
  });

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', top: 20, right: 20, zIndex: 2000,
              background: toast.type === 'error' ? '#ef4444' : '#10b981',
              color: 'white', padding: '12px 20px', borderRadius: 10,
              fontWeight: 600, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Modal */}
      <AnimatePresence>
        {cancelTarget && (
          <CancelModal
            appointment={cancelTarget}
            onConfirm={handleCancel}
            onClose={() => setCancelTarget(null)}
            loading={cancelling}
          />
        )}
      </AnimatePresence>

      <div className="page-header">
        <div>
          <h1 className="page-title"><Calendar size={22} /> My Appointments</h1>
          <p className="page-sub">{appointments.length} total appointments</p>
        </div>
      </div>

      {/* Active alert */}
      {appointments.filter(a => a.status === 'In-Consultation').map(a => (
        <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="your-turn-card" style={{ borderRadius: 12, padding: '16px 20px' }}>
          <div className="your-turn-content">
            <span className="your-turn-icon">🔔</span>
            <div><h3>It's Your Turn!</h3><p>Dr. {a.doctor_name} is ready — Token #{a.token_number}</p></div>
            <button className="btn btn-sm" style={{ background: 'white', color: '#065f46', marginLeft: 'auto' }}
              onClick={() => navigate('/patient/queue')}>Track</button>
          </div>
        </motion.div>
      ))}

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {filters.map(f => {
          const count = f === 'all' ? appointments.length
            : f === 'pending' ? appointments.filter(a => a.status === 'pending').length
            : f === 'active' ? appointments.filter(a => ['Waiting','confirmed','In-Consultation'].includes(a.status)).length
            : f === 'completed' ? appointments.filter(a => ['Completed','completed'].includes(a.status)).length
            : appointments.filter(a => ['Cancelled','cancelled'].includes(a.status)).length;
          return (
            <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="card"><div className="empty-state"><Calendar size={48} /><p>No appointments found</p>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/patient/book')}>Book Now</button>
        </div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(a => {
            const cfg = statusConfig[a.status] || statusConfig['Waiting'];
            const step = getWorkflowStep(a.status);
            const isRejected = ['Cancelled','cancelled'].includes(a.status);
            const isOpen = expanded[a.id];
            const showCancel = canCancel(a.status);

            return (
              <div key={a.id} className={`appt-card ${isRejected ? 'appt-card-rejected' : step >= 3 ? 'appt-card-active' : ''}`}>
                {/* Card Header */}
                <div className="appt-card-header" onClick={() => toggle(a.id)}>
                  <div className="appt-card-left">
                    <div className="appt-token-badge">#{a.token_number || '—'}</div>
                    <div>
                      <p className="fw-700">{a.doctor_name}</p>
                      <p className="text-muted text-sm">{a.specialty} · {a.date}</p>
                    </div>
                  </div>
                  <div className="appt-card-right">
                    <span className={`badge ${cfg.color}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {cfg.icon} {cfg.label}
                    </span>
                    {showCancel && (
                      <button
                        onClick={e => { e.stopPropagation(); setCancelTarget(a); }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#dc2626';
                          e.currentTarget.style.color = '#ffffff';
                          e.currentTarget.style.borderColor = '#dc2626';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = '#fee2e2';
                          e.currentTarget.style.color = '#dc2626';
                          e.currentTarget.style.borderColor = '#fca5a5';
                        }}
                        style={{
                          background: '#fee2e2', color: '#dc2626',
                          border: '1px solid #fca5a5', borderRadius: 8,
                          padding: '6px 12px', fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', display: 'flex', alignItems: 'center',
                          gap: 5, transition: 'all 0.25s ease'
                        }}
                      >
                        <Trash2 size={12} /> Cancel
                      </button>
                    )}
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isOpen && (
                  <div className="appt-card-body">

                    {/* Appointment Info Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
                      <div style={{ background: '#f0f9ff', borderRadius: 8, padding: '10px 12px', textAlign: 'center', border: '1.5px solid #bae6fd' }}>
                        <p style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>🎫 Token Number</p>
                        <p style={{ fontWeight: 800, fontSize: 20, color: '#2563eb' }}>#{a.token_number || '—'}</p>
                      </div>
                      <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '10px 12px', textAlign: 'center', border: '1.5px solid #bbf7d0' }}>
                        <p style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>📅 Date</p>
                        <p style={{ fontWeight: 700, fontSize: 13, color: '#166534' }}>{a.date}</p>
                      </div>
                      <div style={{ background: '#fdf4ff', borderRadius: 8, padding: '10px 12px', textAlign: 'center', border: '1.5px solid #e9d5ff' }}>
                        <p style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>🏷️ Type</p>
                        <p style={{ fontWeight: 700, fontSize: 13, color: '#7c3aed' }}>{a.type || 'Normal'}</p>
                      </div>
                    </div>

                    <p className="text-muted text-sm mb-3">📋 {a.reason_for_visit}</p>

                    {/* Waiting Time Card */}
                    {['Waiting','confirmed','In-Consultation'].includes(a.status) && (
                      <WaitingTimeCard appointment={a} />
                    )}

                    {/* Pending Notice */}
                    {a.status === 'pending' && (
                      <div className="pending-notice">
                        <Clock size={16} style={{ color: '#d97706', flexShrink: 0 }} />
                        <div>
                          <p className="fw-700 text-sm" style={{ color: '#d97706' }}>⏳ Awaiting Receptionist Approval</p>
                          <p className="text-xs text-muted mt-1">
                            Your appointment is under review. The receptionist will approve or reject it shortly.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Rejection Notice */}
                    {isRejected && (
                      <div className="rejection-notice">
                        <XCircle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
                        <div>
                          <p className="fw-700 text-sm" style={{ color: '#dc2626' }}>Appointment Cancelled</p>
                          {a.rejection_reason && (
                            <p className="text-sm mt-1"><strong>Reason:</strong> {a.rejection_reason}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Workflow Progress */}
                    {!isRejected && (
                      <div className="workflow-progress">
                        <p className="text-xs fw-700 text-muted uppercase mb-3">Appointment Progress</p>
                        <div className="workflow-steps">
                          {WORKFLOW_STEPS.map((ws, i) => {
                            const done = i <= step;
                            const active = i === step;
                            return (
                              <div key={i} className="workflow-step-item">
                                <div className={`ws-circle ${done ? 'ws-done' : active ? 'ws-active' : 'ws-pending'}`}>
                                  {done ? '✓' : ws.icon}
                                </div>
                                <div className="ws-content">
                                  <p className={`text-sm fw-600 ${done ? '' : 'text-muted'}`}>{ws.label}</p>
                                  {active && <p className="text-xs text-muted">{ws.desc}</p>}
                                </div>
                                {i < WORKFLOW_STEPS.length - 1 && (
                                  <div className={`ws-line ${done ? 'ws-line-done' : ''}`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                      {['Waiting','In-Consultation'].includes(a.status) && (
                        <button className="btn btn-sm btn-primary" onClick={() => navigate('/patient/queue')}>
                          <Clock size={13} /> Track Queue
                        </button>
                      )}
                      {['Completed','completed'].includes(a.status) && (
                        <button className="btn btn-sm btn-outline" onClick={() => navigate('/patient/prescriptions')}>
                          💊 View Prescription
                        </button>
                      )}
                      {isRejected && (
                        <button className="btn btn-sm btn-primary" onClick={() => navigate('/patient/book')}>
                          📅 Book New Appointment
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
