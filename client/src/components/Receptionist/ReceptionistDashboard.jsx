import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { receptionistService, socket } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Clock, CheckCircle2, XCircle,
  UserCheck, CreditCard, AlertCircle, Search, RefreshCw,
  CalendarPlus, Activity, Shield, FileText, ChevronDown, ChevronUp
} from 'lucide-react';

import PaymentModal from './PaymentModal';

const APPROVAL_CRITERIA = [
  { id: 1, title: 'Valid Patient Identity', desc: 'Patient must be registered with a valid name and email in the system.' },
  { id: 2, title: 'Doctor Availability', desc: 'The selected doctor must be available and accepting appointments on the requested date.' },
  { id: 3, title: 'Appointment Slot Available', desc: 'The requested slot must not exceed the maximum token limit per session.' },
  { id: 4, title: 'Valid Medical Reason', desc: 'A clear and valid reason for visit must be provided by the patient.' },
  { id: 5, title: 'No Duplicate Booking', desc: 'Patient must not have an existing active appointment with the same doctor on the same date.' },
  { id: 6, title: 'Emergency Verification', desc: 'Emergency appointments must be verified for urgency before being prioritized.' },
];

const REJECTION_REASONS = [
  'Doctor not available on requested date',
  'Maximum appointment slots reached for the day',
  'Duplicate appointment detected for same doctor and date',
  'Invalid or incomplete patient information provided',
  'Appointment request outside clinic working hours',
  'Patient has outstanding dues — payment required first',
  'Emergency claim not verified by medical staff',
  'Other (specify below)',
];

const statusBadge = s => {
  if (s === 'pending')         return { cls: 'badge-pending',  label: '⏳ Pending Review' };
  if (s === 'confirmed')       return { cls: 'badge-success',  label: '✅ Approved' };
  if (s === 'Waiting')         return { cls: 'badge-warning',  label: '⏱ Waiting' };
  if (s === 'In-Consultation') return { cls: 'badge-info',     label: '🩺 In Consultation' };
  if (['Completed','completed'].includes(s)) return { cls: 'badge-info', label: '✔ Completed' };
  if (['Cancelled','cancelled'].includes(s)) return { cls: 'badge-danger', label: '❌ Rejected' };
  return { cls: 'badge-warning', label: s };
};

export default function ReceptionistDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [time, setTime] = useState(new Date());
  const [toast, setToast] = useState('');
  const [showCriteria, setShowCriteria] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [approveModal, setApproveModal] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const d = await receptionistService.getDashboardStats();
      setData(d);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    socket.emit('join_queue');
    socket.on('queue_updated', fetchData);
    socket.on('appointment_updated', fetchData);
    return () => { socket.off('queue_updated', fetchData); socket.off('appointment_updated', fetchData); };
  }, [fetchData]);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleApprove = async (appt) => {
    await receptionistService.updateStatus(appt.id, 'confirmed');
    notify(`✅ ${appt.patient_name}'s appointment approved — added to queue`);
    setApproveModal(null);
    fetchData();
  };

  const handleReject = async () => {
    if (!rejectReason) return;
    const finalReason = rejectReason === 'Other (specify below)' ? customReason : rejectReason;
    await receptionistService.updateStatus(rejectModal.id, 'cancelled', finalReason);
    notify(`🚫 Appointment rejected — patient will be notified`);
    setRejectModal(null);
    setRejectReason('');
    setCustomReason('');
    fetchData();
  };

  const checkIn = async (id, name) => {
    await receptionistService.checkIn(id);
    notify(`✅ ${name} checked in — now in doctor's queue`);
    fetchData();
  };

  const markPaid = async (id) => {
    await receptionistService.updatePayment(id, 'paid');
    notify('✅ Payment marked as paid');
    fetchData();
  };

  const allAppts = data?.appointments || [];
  const tabs = [
    { key: 'pending',   label: 'Pending Review', count: allAppts.filter(a => a.status === 'pending').length },
    { key: 'confirmed', label: 'Approved',        count: allAppts.filter(a => a.status === 'confirmed').length },
    { key: 'active',    label: 'Active Queue',    count: allAppts.filter(a => ['Waiting','In-Consultation'].includes(a.status)).length },
    { key: 'all',       label: 'All Today',       count: allAppts.length },
  ];

  const filtered = allAppts.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.patient_name?.toLowerCase().includes(q) ||
      a.doctor_name?.toLowerCase().includes(q) || String(a.token_number).includes(q);
    if (!matchSearch) return false;
    if (activeTab === 'pending')   return a.status === 'pending';
    if (activeTab === 'confirmed') return a.status === 'confirmed';
    if (activeTab === 'active')    return ['Waiting','In-Consultation'].includes(a.status);
    return true;
  });

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title"><LayoutDashboard size={22} /> Reception Desk</h1>
          <p className="page-sub" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={13} />
            {time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            &nbsp;·&nbsp;<span className="live-clock">{time.toLocaleTimeString()}</span>
          </p>
        </div>
        <div className="header-actions">
          {toast && <span className="action-toast">{toast}</span>}
          <button className="btn btn-outline" onClick={fetchData}><RefreshCw size={15} /> Refresh</button>
          <button className="btn btn-primary" onClick={() => navigate('/receptionist/walkin')}>
            <CalendarPlus size={15} /> Walk-In
          </button>
        </div>
      </div>

      {/* Emergency Alert */}
      {data?.emergency > 0 && (
        <div className="cdss-banner" style={{ background: '#fee2e2', borderColor: '#fca5a5' }}>
          <AlertCircle size={16} style={{ color: '#dc2626' }} />
          <strong style={{ color: '#dc2626' }}>🚨 {data.emergency} Emergency patient(s) require immediate attention!</strong>
        </div>
      )}

      {/* Pending Alert */}
      {data?.pending > 0 && (
        <div className="cdss-banner" style={{ background: '#fef3c7', borderColor: '#fcd34d' }}>
          <Clock size={16} style={{ color: '#d97706' }} />
          <strong style={{ color: '#d97706' }}>{data.pending} appointment(s) waiting for your approval</strong>
          <button className="btn btn-sm btn-warning" onClick={() => setActiveTab('pending')}>Review Now</button>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon={<Clock size={20} />}        label="Pending Review"   value={data?.pending || 0}         color="warning" />
        <StatCard icon={<Users size={20} />}        label="Waiting"          value={data?.waiting || 0}         color="primary" />
        <StatCard icon={<Activity size={20} />}     label="In Consultation"  value={data?.in_consultation || 0} color="success" />
        <StatCard icon={<CheckCircle2 size={20} />} label="Completed"        value={data?.completed || 0}       color="primary" />
        <StatCard icon={<XCircle size={20} />}      label="Rejected"         value={data?.no_show || 0}         color="danger" />
        <StatCard icon={<AlertCircle size={20} />}  label="Emergency"        value={data?.emergency || 0}       color="danger" />
      </div>

      {/* Quick Nav */}
      <div className="rec-quick-nav">
        {[
          { label: 'Walk-In',      icon: '🚶', path: '/receptionist/walkin',       color: '#2563eb' },
          { label: 'Appointments', icon: '📅', path: '/receptionist/appointments', color: '#0891b2' },
          { label: 'Queue',        icon: '⏱️', path: '/receptionist/queue',        color: '#f59e0b' },
          { label: 'Patients',     icon: '🔍', path: '/receptionist/patients',     color: '#7c3aed' },
          { label: 'Doctors',      icon: '🩺', path: '/receptionist/doctors',      color: '#10b981' },
          { label: 'Reports',      icon: '📊', path: '/receptionist/reports',      color: '#dc2626' },
        ].map(item => (
          <motion.button key={item.path} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            className="quick-nav-btn" onClick={() => navigate(item.path)}>
            <span className="qn-icon" style={{ background: item.color, fontSize: 18 }}>{item.icon}</span>
            <span>{item.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Approval Criteria Accordion */}
      <div className="criteria-panel">
        <div className="criteria-header" onClick={() => setShowCriteria(s => !s)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={18} style={{ color: '#2563eb' }} />
            <div>
              <h3 className="fw-700">Official Appointment Approval Criteria</h3>
              <p className="text-muted text-xs">Click to view formal guidelines for approving or rejecting appointments</p>
            </div>
          </div>
          {showCriteria ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        <AnimatePresence>
          {showCriteria && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <div className="criteria-body">
                <div className="criteria-grid">
                  {APPROVAL_CRITERIA.map(c => (
                    <div key={c.id} className="criteria-item">
                      <div className="criteria-num">{c.id}</div>
                      <div>
                        <p className="fw-700 text-sm">{c.title}</p>
                        <p className="text-muted text-xs mt-1">{c.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="criteria-note">
                  <FileText size={14} />
                  <p className="text-xs">All approval/rejection decisions are logged. Rejections must include a formal reason.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Appointments Table */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {tabs.map(t => (
              <button key={t.key}
                className={`filter-tab ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => setActiveTab(t.key)}>
                {t.label}
                <span style={{ marginLeft: 6, background: activeTab === t.key ? 'rgba(255,255,255,0.3)' : 'var(--border)', borderRadius: 999, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 32, padding: '8px 12px 8px 32px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, outline: 'none', width: 220 }} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <Users size={40} />
            <p>{activeTab === 'pending' ? 'No pending appointments to review' : 'No appointments found'}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>Token</th><th>Patient</th><th>Doctor</th><th>Reason</th><th>Type</th><th>Status</th><th>Payment</th><th>Actions</th></tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map(a => {
                    const sb = statusBadge(a.status);
                    return (
                      <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className={`${a.type === 'Emergency' ? 'row-emergency' : ''} ${a.status === 'pending' ? 'row-pending' : ''}`}>
                        <td><span className="token-num">#{a.token_number}</span></td>
                        <td>
                          <div className="patient-cell">
                            <div className="patient-avatar">{a.patient_name?.charAt(0)}</div>
                            <div>
                              <p className="fw-700">{a.patient_name}</p>
                              <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                                {a.patient_age && <span className="text-xs text-muted">{a.patient_age} yrs</span>}
                                {a.patient_gender && <span className="text-xs text-muted">{a.patient_gender}</span>}
                                {a.patient_phone && <span className="text-xs text-muted">{a.patient_phone}</span>}
                                {a.patient_blood && <span className="badge badge-danger" style={{ fontSize: 9, padding: '1px 6px' }}>{a.patient_blood}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="fw-500">{a.doctor_name}</td>
                        <td className="text-muted text-sm" style={{ maxWidth: 160 }}>{a.reason_for_visit}</td>
                        <td><span className={`badge ${a.type === 'Emergency' ? 'badge-danger' : 'badge-info'}`}>{a.type || 'Normal'}</span></td>
                        <td><span className={`badge ${sb.cls}`}>{sb.label}</span></td>
                        <td><span className={`badge ${a.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{a.payment_status || 'pending'}</span></td>
                        <td>
                          <div className="action-btns">
                            {/* APPROVE — only for pending */}
                            {a.status === 'pending' && (
                              <button className="btn btn-sm btn-success" onClick={() => setApproveModal(a)}>
                                <CheckCircle2 size={13} /> Approve
                              </button>
                            )}
                            {/* REJECT — only for pending */}
                            {a.status === 'pending' && (
                              <button className="btn btn-sm btn-danger" onClick={() => setRejectModal(a)}>
                                <XCircle size={13} /> Reject
                              </button>
                            )}
                            {/* CHECK IN — only for confirmed */}
                            {a.status === 'confirmed' && (
                              <button className="btn btn-sm btn-primary" onClick={() => checkIn(a.id, a.patient_name)}>
                                <UserCheck size={13} /> Check In
                              </button>
                            )}
                            {/* PAYMENT */}
                            {a.payment_status !== 'paid' && !['Cancelled','cancelled','pending'].includes(a.status) && (
                              <button className="btn btn-sm btn-warning"
                                onClick={() => setPaymentModal(a)}>
                                <CreditCard size={13} /> Pay
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

      {/* ── APPROVE MODAL ── */}
      {approveModal && (
        <div className="modal-overlay" onClick={() => setApproveModal(null)}>
          <motion.div className="modal-box" onClick={e => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="modal-header">
              <h3 className="fw-700">✅ Approve Appointment</h3>
              <button className="btn btn-xs btn-outline" onClick={() => setApproveModal(null)}>✕</button>
            </div>
            <div className="approve-modal-body">
              <div className="approve-patient-info">
                <div className="patient-avatar" style={{ width: 44, height: 44, fontSize: 18 }}>{approveModal.patient_name?.charAt(0)}</div>
                <div>
                  <p className="fw-700">{approveModal.patient_name}</p>
                  <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                    {approveModal.patient_age && <span className="badge badge-info" style={{ fontSize: 10 }}>{approveModal.patient_age} yrs</span>}
                    {approveModal.patient_gender && <span className="badge badge-info" style={{ fontSize: 10 }}>{approveModal.patient_gender}</span>}
                    {approveModal.patient_phone && <span className="text-muted text-xs">{approveModal.patient_phone}</span>}
                    {approveModal.patient_blood && <span className="badge badge-danger" style={{ fontSize: 10 }}>{approveModal.patient_blood}</span>}
                  </div>
                  <p className="text-muted text-sm mt-1">🩺 Dr. {approveModal.doctor_name} · Token #{approveModal.token_number}</p>
                  <p className="text-muted text-xs mt-1">📋 {approveModal.reason_for_visit}</p>
                </div>
              </div>
              <div className="criteria-checklist">
                <p className="fw-600 text-sm mb-2">Approval Checklist:</p>
                {APPROVAL_CRITERIA.map(c => (
                  <div key={c.id} className="checklist-item">
                    <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                    <span className="text-sm">{c.title}</span>
                  </div>
                ))}
              </div>
              <div className="modal-actions mt-3">
                <button className="btn btn-success w-full" onClick={() => handleApprove(approveModal)}>
                  <CheckCircle2 size={15} /> Confirm Approval — Add to Queue
                </button>
                <button className="btn btn-outline w-full" onClick={() => setApproveModal(null)}>Cancel</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── REJECT MODAL ── */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <motion.div className="modal-box" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="modal-header">
              <h3 className="fw-700">🚫 Reject Appointment</h3>
              <button className="btn btn-xs btn-outline" onClick={() => setRejectModal(null)}>✕</button>
            </div>
            <div className="reject-modal-body">
              <div className="approve-patient-info mb-3">
                <div className="patient-avatar" style={{ width: 44, height: 44, fontSize: 18 }}>{rejectModal.patient_name?.charAt(0)}</div>
                <div>
                  <p className="fw-700">{rejectModal.patient_name}</p>
                  <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                    {rejectModal.patient_age && <span className="badge badge-info" style={{ fontSize: 10 }}>{rejectModal.patient_age} yrs</span>}
                    {rejectModal.patient_gender && <span className="badge badge-info" style={{ fontSize: 10 }}>{rejectModal.patient_gender}</span>}
                    {rejectModal.patient_blood && <span className="badge badge-danger" style={{ fontSize: 10 }}>{rejectModal.patient_blood}</span>}
                  </div>
                  <p className="text-muted text-sm mt-1">🩺 Dr. {rejectModal.doctor_name} · {rejectModal.date}</p>
                  <p className="text-muted text-xs">📋 {rejectModal.reason_for_visit}</p>
                </div>
              </div>
              <div className="field-group">
                <label className="fw-600">Select Formal Rejection Reason *</label>
                <div className="reject-reasons-list">
                  {REJECTION_REASONS.map((r, i) => (
                    <div key={i} className={`reject-reason-item ${rejectReason === r ? 'selected' : ''}`}
                      onClick={() => setRejectReason(r)}>
                      <div className={`rr-radio ${rejectReason === r ? 'rr-selected' : ''}`} />
                      <span className="text-sm">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
              {rejectReason === 'Other (specify below)' && (
                <div className="field-group mt-2">
                  <label>Specify Reason</label>
                  <textarea rows={2} placeholder="Enter specific rejection reason..."
                    value={customReason} onChange={e => setCustomReason(e.target.value)} />
                </div>
              )}
              <div className="reject-note mt-2">
                <Shield size={13} />
                <p className="text-xs">This rejection reason will be formally recorded and shown to the patient.</p>
              </div>
              <div className="modal-actions mt-3">
                <button className="btn btn-danger w-full" onClick={handleReject}
                  disabled={!rejectReason || (rejectReason === 'Other (specify below)' && !customReason)}>
                  <XCircle size={15} /> Confirm Rejection
                </button>
                <button className="btn btn-outline w-full" onClick={() => { setRejectModal(null); setRejectReason(''); setCustomReason(''); }}>
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {/* ── PAYMENT MODAL ── */}
      {paymentModal && (
        <PaymentModal
          appointment={paymentModal}
          onClose={() => setPaymentModal(null)}
          onSuccess={() => { fetchData(); notify('✅ Payment collected successfully'); }}
        />
      )}
    </div>
  );
}

const StatCard = ({ icon, label, value, color }) => (
  <div className={`stat-card ${color ? `stat-${color}` : ''}`}>
    <div className="stat-icon">{icon}</div>
    <div><p className="stat-label">{label}</p><h2 className="stat-value">{value}</h2></div>
  </div>
);
