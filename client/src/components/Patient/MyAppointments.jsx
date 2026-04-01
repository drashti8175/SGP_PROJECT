import React, { useState, useEffect } from 'react';
import { patientService, socket } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, RefreshCw, Clock, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

// Full workflow steps shown to patient
const WORKFLOW_STEPS = [
  { key: 'booked',      label: 'Appointment Booked',        icon: '📋', desc: 'Your appointment request has been submitted.' },
  { key: 'approved',    label: 'Approved by Receptionist',  icon: '✅', desc: 'Receptionist has verified and approved your appointment.' },
  { key: 'checkedin',   label: 'Checked In at Clinic',      icon: '🏥', desc: 'You have been checked in and added to the doctor\'s queue.' },
  { key: 'consulting',  label: 'In Consultation',           icon: '🩺', desc: 'Doctor is currently consulting with you.' },
  { key: 'completed',   label: 'Consultation Completed',    icon: '💊', desc: 'Consultation done. Check your prescriptions.' },
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
  'Cancelled':       { color: 'badge-danger',   icon: <XCircle size={12} />,      label: '❌ Rejected' },
  'cancelled':       { color: 'badge-danger',   icon: <XCircle size={12} />,      label: '❌ Rejected' },
};

export default function MyAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState({});

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

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const filters = ['all', 'pending', 'active', 'completed', 'rejected'];
  const filtered = appointments.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'pending') return a.status === 'pending';
    if (filter === 'active') return ['Waiting','confirmed','In-Consultation'].includes(a.status);
    if (filter === 'completed') return ['Completed','completed'].includes(a.status);
    if (filter === 'rejected') return ['Cancelled','cancelled'].includes(a.status);
    return true;
  });

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Calendar size={22} /> My Appointments</h1>
          <p className="page-sub">{appointments.length} total appointments</p>
        </div>
        <button className="btn btn-outline" onClick={fetchData}><RefreshCw size={15} /> Refresh</button>
      </div>

      {/* Active appointment alert */}
      {appointments.filter(a => a.status === 'In-Consultation').map(a => (
        <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="your-turn-card" style={{ borderRadius: 12, padding: '16px 20px' }}>
          <div className="your-turn-content">
            <span className="your-turn-icon">🔔</span>
            <div>
              <h3>It's Your Turn!</h3>
              <p>Dr. {a.doctor_name} is ready to see you — Token #{a.token_number}</p>
            </div>
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

      {/* Appointments List */}
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
                    {a.type === 'Emergency' && <span className="badge badge-danger">🚨 Emergency</span>}
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isOpen && (
                  <div className="appt-card-body">
                    <p className="text-muted text-sm mb-3">📋 {a.reason_for_visit}</p>

                    {/* Pending Notice */}
                    {a.status === 'pending' && (
                      <div className="pending-notice">
                        <Clock size={16} style={{ color: '#d97706', flexShrink: 0 }} />
                        <div>
                          <p className="fw-700 text-sm" style={{ color: '#d97706' }}>⏳ Awaiting Receptionist Approval</p>
                          <p className="text-xs text-muted mt-1">
                            Your appointment is under review. The receptionist will approve or reject it based on clinic criteria.
                            You will see the decision here once processed.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Rejection Notice */}
                    {isRejected && (
                      <div className="rejection-notice">
                        <XCircle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
                        <div>
                          <p className="fw-700 text-sm" style={{ color: '#dc2626' }}>Appointment Rejected by Receptionist</p>
                          <p className="text-sm mt-1">
                            <strong>Reason:</strong> {a.rejection_reason || 'No reason provided'}
                          </p>
                          <p className="text-xs text-muted mt-1">
                            You may book a new appointment after resolving the above issue.
                          </p>
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
