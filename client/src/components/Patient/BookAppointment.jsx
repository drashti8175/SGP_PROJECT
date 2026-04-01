import React, { useState, useEffect } from 'react';
import { patientService, api } from '../../services/api';
import { useAuth } from '../../App';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarPlus, Stethoscope, Clock, ChevronRight,
  CheckCircle2, QrCode, User, Phone, Heart, Quote, Shield, Info
} from 'lucide-react';

const QUOTES = [
  { text: "Your health is an investment, not an expense.", author: "Unknown" },
  { text: "The greatest wealth is health.", author: "Virgil" },
  { text: "Take care of your body — it's the only place you have to live.", author: "Jim Rohn" },
];
const Q = QUOTES[Math.floor(Math.random() * QUOTES.length)];

// Criteria shown to patient before booking
const BOOKING_CRITERIA = [
  { icon: '✅', title: 'Valid Identity Required', desc: 'You must be a registered patient with a valid name and email address.' },
  { icon: '🩺', title: 'Doctor Must Be Available', desc: 'Your selected doctor must be available and accepting appointments today.' },
  { icon: '📋', title: 'Clear Medical Reason', desc: 'You must provide a clear and valid reason for your visit.' },
  { icon: '🚫', title: 'No Duplicate Booking', desc: 'You cannot book more than one appointment with the same doctor on the same day.' },
  { icon: '🚨', title: 'Emergency Verification', desc: 'Emergency appointments are subject to verification by the receptionist before being prioritized.' },
  { icon: '⏳', title: 'Pending Approval', desc: 'All appointments require receptionist approval before being confirmed. You will be notified of the decision.' },
];

export default function BookAppointment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState(null);
  const [queueCounts, setQueueCounts] = useState({});
  const [criteriaAccepted, setCriteriaAccepted] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', age: '', gender: '', blood_group: '',
    reason_for_visit: '', type: 'Normal', symptoms: ''
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    // Do NOT pre-fill name — patient must enter it themselves
    patientService.getDoctors().then(async docs => {
      setDoctors(docs);
      const counts = {};
      for (const d of docs) {
        const id = d.doctor_id || d._id;
        try { const q = await patientService.getFullQueue(id); counts[id] = q.length; }
        catch { counts[id] = 0; }
      }
      setQueueCounts(counts);
    }).catch(console.error);
  }, []);

  const getHint = (id) => {
    const c = queueCounts[id] || 0;
    if (c === 0) return { label: '✅ Available Now', color: 'badge-success' };
    if (c <= 3) return { label: `~${c * 10} min wait`, color: 'badge-warning' };
    return { label: `~${c * 10} min wait`, color: 'badge-danger' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // prevent double submit
    setError(''); setLoading(true);
    try {
      if (form.phone || form.age || form.gender || form.blood_group) {
        await api.patch('/auth/update-profile', {
          phone: form.phone, gender: form.gender, blood_group: form.blood_group,
          dob: form.age ? new Date(new Date().getFullYear() - parseInt(form.age), 0, 1).toISOString() : undefined
        }).catch(() => {});
      }
      const reason = form.symptoms
        ? `${form.reason_for_visit} — Symptoms: ${form.symptoms}`
        : form.reason_for_visit;

      const data = await patientService.book({
        doctor_id: selected.doctor_id || selected._id,
        reason_for_visit: reason,
        type: form.type,
        patient_name: form.name,
        phone: form.phone,
        gender: form.gender,
        blood_group: form.blood_group,
      });
      setResult({ ...data, doctorName: selected.name, specialization: selected.specialization });
      setStep(4);
    } catch (e) {
      setError(e.response?.data?.error || 'Booking failed. Please try again.');
    } finally { setLoading(false); }
  };

  // ── STEP 4: SUCCESS ──
  if (step === 4 && result) return (
    <div className="page">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="booking-success-page">
        <div className="booking-success-card">
          <div className="bsc-top-banner">
            <span style={{ fontSize: 48 }}>🎉</span>
            <h2 className="fw-900">Appointment Submitted!</h2>
            <p className="text-muted">Your request is pending receptionist approval</p>
          </div>

          <div className="bsc-token-box">
            <p className="text-xs fw-700 uppercase" style={{ color: 'rgba(255,255,255,0.7)', letterSpacing: 2 }}>Your Token Number</p>
            <h1 className="bsc-token">#{result.token_number}</h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Keep this number handy</p>
          </div>

          <div className="bsc-details">
            <div className="bsc-detail-row"><span>👤 Patient</span><span className="fw-700">{form.name || user?.name}</span></div>
            <div className="bsc-detail-row"><span>🩺 Doctor</span><span className="fw-700">{result.doctorName}</span></div>
            <div className="bsc-detail-row"><span>🏥 Specialty</span><span className="fw-600">{result.specialization}</span></div>
            <div className="bsc-detail-row"><span>📋 Type</span>
              <span className={`badge ${form.type === 'Emergency' ? 'badge-danger' : 'badge-info'}`}>{form.type}</span>
            </div>
            <div className="bsc-detail-row"><span>📅 Date</span>
              <span className="fw-600">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Pending notice */}
          <div className="bsc-pending-notice">
            <Clock size={16} style={{ color: '#d97706', flexShrink: 0 }} />
            <div>
              <p className="fw-700 text-sm" style={{ color: '#d97706' }}>Awaiting Receptionist Approval</p>
              <p className="text-xs text-muted mt-1">
                The receptionist will review your appointment based on the clinic criteria.
                You will be notified once approved or if rejected with a reason.
              </p>
            </div>
          </div>

          <div className="bsc-workflow">
            <p className="text-xs fw-700 uppercase text-muted mb-2">What happens next?</p>
            {[
              { icon: '⏳', text: 'Receptionist reviews and approves your appointment' },
              { icon: '✅', text: 'You receive approval confirmation' },
              { icon: '🏥', text: 'Arrive at clinic and check in at reception' },
              { icon: '📲', text: 'Show your QR code at reception counter' },
              { icon: '🩺', text: 'Doctor calls your token number' },
              { icon: '💊', text: 'Receive digital prescription after consultation' },
            ].map((w, i) => (
              <div key={i} className="bsc-workflow-item">
                <span>{w.icon}</span><span className="text-sm">{w.text}</span>
              </div>
            ))}
          </div>

          <div className="bsc-quote">
            <Quote size={14} />
            <em>"{Q.text}" — {Q.author}</em>
          </div>

          <div className="bsc-actions">
            <button className="btn btn-primary" onClick={() => navigate('/patient/appointments')}>
              <Clock size={15} /> Track Status
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/patient/qr')}>
              <QrCode size={15} /> Get QR Code
            </button>
            <button className="btn btn-outline" onClick={() => {
              setStep(1); setResult(null); setSelected(null); setCriteriaAccepted(false);
              setForm({ name: user?.name || '', phone: '', age: '', gender: '', blood_group: '', reason_for_visit: '', type: 'Normal', symptoms: '' });
            }}>Book Another</button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><CalendarPlus size={22} /> Book Appointment</h1>
          <p className="page-sub">Schedule your visit in simple steps</p>
        </div>
      </div>

      {/* Quote */}
      <div className="health-quote-banner">
        <Quote size={24} className="quote-icon" />
        <div>
          <p className="quote-text">"{Q.text}"</p>
          <p className="quote-author">— {Q.author}</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="booking-steps">
        {['Criteria', 'Select Doctor', 'Your Details', 'Confirm'].map((s, i) => (
          <React.Fragment key={i}>
            <div className={`booking-step ${step > i + 1 ? 'done' : step === i + 1 ? 'active' : ''}`}>
              <div className="bs-circle">{step > i + 1 ? '✓' : i + 1}</div>
              <span>{s}</span>
            </div>
            {i < 3 && <div className={`bs-line ${step > i + 1 ? 'done' : ''}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* ── STEP 1: BOOKING CRITERIA ── */}
      {step === 1 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Shield size={22} style={{ color: '#2563eb' }} />
            <div>
              <h3 className="fw-800">Appointment Booking Criteria</h3>
              <p className="text-muted text-sm">Please read and accept the following criteria before booking</p>
            </div>
          </div>

          <div className="booking-criteria-grid">
            {BOOKING_CRITERIA.map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }} className="booking-criteria-item">
                <span className="bci-icon">{c.icon}</span>
                <div>
                  <p className="fw-700 text-sm">{c.title}</p>
                  <p className="text-muted text-xs mt-1">{c.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="criteria-accept-row">
            <label className="criteria-checkbox-label">
              <input type="checkbox" checked={criteriaAccepted}
                onChange={e => setCriteriaAccepted(e.target.checked)} />
              <span>I have read and understood all the above appointment booking criteria</span>
            </label>
          </div>

          <button className="btn btn-primary w-full mt-3" disabled={!criteriaAccepted}
            onClick={() => setStep(2)}>
            I Accept — Proceed to Book →
          </button>
        </div>
      )}

      {/* ── STEP 2: SELECT DOCTOR ── */}
      {step === 2 && (
        <div className="card">
          <h3 className="card-title mb-4"><Stethoscope size={18} /> Select a Doctor</h3>
          {doctors.length === 0 ? (
            <div className="empty-state"><Stethoscope size={40} /><p>Loading doctors...</p></div>
          ) : (
            <div className="doctor-cards-grid">
              {doctors.map(d => {
                const id = d.doctor_id || d._id;
                const hint = getHint(id);
                return (
                  <motion.div key={id} whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.1)' }}
                    className="doctor-card" onClick={() => { setSelected(d); setStep(3); }}>
                    <div className="doctor-card-avatar">{d.name?.split(' ').pop()?.charAt(0) || 'D'}</div>
                    <div className="doctor-card-info">
                      <p className="fw-700">{d.name}</p>
                      <p className="text-muted text-sm">{d.specialization}</p>
                      <p className="text-muted text-xs">{d.experience || 0} yrs experience</p>
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        <span className="badge badge-info">₹{d.consultationFee}</span>
                        <span className={`badge ${hint.color}`}>{hint.label}</span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-muted" />
                  </motion.div>
                );
              })}
            </div>
          )}
          <button className="btn btn-outline mt-3" onClick={() => setStep(1)}>← Back</button>
        </div>
      )}

      {/* ── STEP 3: PATIENT DETAILS + APPOINTMENT ── */}
      {step === 3 && selected && (
        <div className="two-col-grid">
          {/* Patient Info */}
          <div className="card">
            <h3 className="card-title mb-4"><User size={18} /> Your Information</h3>
            <div className="form-stack">
              <div className="field-group">
                <label>Full Name *</label>
                <input placeholder="Enter your full name" value={form.name}
                  onChange={e => setF('name', e.target.value)} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field-group">
                  <label>Age</label>
                  <input type="number" min="1" max="120" placeholder="e.g. 25"
                    value={form.age} onChange={e => setF('age', e.target.value)} />
                </div>
                <div className="field-group">
                  <label>Gender</label>
                  <select value={form.gender} onChange={e => setF('gender', e.target.value)}>
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field-group">
                  <label><Phone size={12} /> Phone</label>
                  <input placeholder="+91 XXXXX XXXXX" value={form.phone}
                    onChange={e => setF('phone', e.target.value)} />
                </div>
                <div className="field-group">
                  <label><Heart size={12} /> Blood Group</label>
                  <select value={form.blood_group} onChange={e => setF('blood_group', e.target.value)}>
                    <option value="">Select</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="card">
            <div className="selected-doctor-banner mb-4">
              <div className="doctor-card-avatar" style={{ width: 44, height: 44, fontSize: 18 }}>
                {selected.name?.split(' ').pop()?.charAt(0)}
              </div>
              <div>
                <p className="fw-700">{selected.name}</p>
                <p className="text-muted text-sm">{selected.specialization} · ₹{selected.consultationFee}</p>
              </div>
              <button className="btn btn-sm btn-outline" style={{ marginLeft: 'auto' }} onClick={() => setStep(2)}>
                Change
              </button>
            </div>

            <form onSubmit={handleSubmit} className="form-stack">
              <div className="field-group">
                <label>Main Reason for Visit *</label>
                <input placeholder="e.g. Fever, Chest pain, Regular checkup..."
                  value={form.reason_for_visit}
                  onChange={e => setF('reason_for_visit', e.target.value)} required />
              </div>
              <div className="field-group">
                <label>Describe Symptoms (optional)</label>
                <textarea rows={3} placeholder="Describe your symptoms — duration, severity, location..."
                  value={form.symptoms} onChange={e => setF('symptoms', e.target.value)} />
              </div>
              <div className="field-group">
                <label>Appointment Type</label>
                <div className="type-selector">
                  {[
                    { val: 'Normal', icon: '📋', desc: 'Regular consultation' },
                    { val: 'Emergency', icon: '🚨', desc: 'Urgent medical attention needed' },
                  ].map(t => (
                    <div key={t.val} className={`type-option ${form.type === t.val ? 'type-selected' : ''}`}
                      onClick={() => setF('type', t.val)}>
                      <span style={{ fontSize: 22 }}>{t.icon}</span>
                      <div><p className="fw-700">{t.val}</p><p className="text-muted text-xs">{t.desc}</p></div>
                      {form.type === t.val && <CheckCircle2 size={18} className="text-primary" style={{ marginLeft: 'auto' }} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Reminder */}
              <div className="booking-reminder">
                <Info size={14} style={{ flexShrink: 0, color: '#2563eb' }} />
                <p className="text-xs" style={{ color: '#1e40af' }}>
                  Your appointment will be reviewed by the receptionist. You will be notified of approval or rejection with a reason.
                </p>
              </div>

              {error && <div className="alert alert-danger">{error}</div>}
              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? 'Submitting...' : '📋 Submit Appointment Request →'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
