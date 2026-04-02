import React, { useState, useEffect } from 'react';
import { receptionistService } from '../../services/api';
import { CalendarPlus, Search, Clock, CheckCircle2 } from 'lucide-react';

export default function WalkInBooking() {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', gender: '', dob: '', blood_group: '', doctor_id: '', reason_for_visit: '', type: 'Normal' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { receptionistService.getDoctors().then(setDoctors).catch(console.error); }, []);

  const setF = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setFieldErrors(prev => ({ ...prev, [k]: '' }));
  };

  const validateForm = () => {
    const errs = {};
    const name = (form.name || '').trim();
    const email = (form.email || '').trim();
    const phone = (form.phone || '').trim();
    const reason = (form.reason_for_visit || '').trim();

    if (!name) errs.name = 'Full name is required.';
    else if (!/^[A-Za-z\s]{3,}$/.test(name)) errs.name = 'Name must be at least 3 characters and contain only letters.';

    if (!phone) errs.phone = 'Phone number is required.';
    else if (!/^[1-9][0-9]{9}$/.test(phone)) errs.phone = 'Phone must be 10 digits and cannot start with 0.';
    
    if (!form.gender) errs.gender = 'Gender is required.';

    if (email && !/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Please enter a valid email address.';

    if (!form.doctor_id) errs.doctor_id = 'Please choose a doctor.';

    if (!reason) errs.reason_for_visit = 'Reason for visit is required.'; // Reason for visit is still mandatory

    if (!form.dob) {
      errs.dob = 'Date of birth is required.';
    } else {
      const dobDate = new Date(form.dob);
      if (isNaN(dobDate.getTime())) errs.dob = 'Please provide a valid date of birth.';
      else if (dobDate > new Date()) errs.dob = 'Date of birth cannot be in the future.';
    }

    if (!form.blood_group) errs.blood_group = 'Blood group is required.';

    setFieldErrors(errs);
    return { valid: Object.keys(errs).length === 0, errs };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { valid } = validateForm();
    if (!valid) {
      setError('Please fix the highlighted fields before submitting.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        gender: form.gender,
        dob: form.dob,
        blood_group: form.blood_group,
        doctor_id: form.doctor_id,
        reason_for_visit: form.reason_for_visit.trim(),
        type: form.type,
      };
      const data = await receptionistService.walkIn(payload);
      const selectedDoctor = doctors.find(d => d._id === payload.doctor_id);
      setResult({
        ...data,
        ...payload,
        doctor_name: selectedDoctor?.name || 'Unknown',
        doctor_specialization: selectedDoctor?.specialization || ''
      });
      setForm({ name: '', email: '', phone: '', gender: '', dob: '', blood_group: '', doctor_id: '', reason_for_visit: '', type: 'Normal' });
      setFieldErrors({});
    } catch (e) {
      setError(e.response?.data?.error || 'Walk-in booking failed.');
    } finally { setLoading(false); }
  };

  const selectedDoc = doctors.find(d => d._id === form.doctor_id);

  if (result) return (
    <div className="page">
      <div className="page-header"><h1 className="page-title"><CheckCircle2 size={22} /> Walk-In Booked!</h1></div>
      <div className="card max-w-lg">
        <div className="booking-success">
          <div className="success-icon">✅</div>
          <h3>Patient Added to Queue</h3>
          <div className="token-display">
            <p className="text-muted">Token Number</p>
            <h1 className="token-big">#{result.token_number}</h1>
          </div>
          <div className="walkin-summary">
            <p><strong>Patient:</strong> {result.name}</p>
            <p><strong>Phone:</strong> {result.phone || 'N/A'}</p>
            <p><strong>Email:</strong> {result.email || 'N/A'}</p>
            <p><strong>Gender:</strong> {result.gender || 'N/A'}</p>
            <p><strong>DOB:</strong> {result.dob ? new Date(result.dob).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Blood Group:</strong> {result.blood_group || 'N/A'}</p>
            <p><strong>Doctor:</strong> {result.doctor_name || 'Unknown'}</p>
            <p><strong>Specialization:</strong> {result.doctor_specialization || 'N/A'}</p>
            <p><strong>Type:</strong> {result.type}</p>
            <p><strong>Status:</strong> Waiting in queue</p>
          </div>
          <p className="text-muted text-sm">Patient can now proceed to the waiting area.</p>
          <button className="btn btn-primary mt-3" onClick={() => setResult(null)}>Add Another Walk-In</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><CalendarPlus size={22} /> Walk-In Booking</h1>
          <p className="page-sub">Direct registration for patients unable to book online</p>
        </div>
      </div>

      <div className="two-col-grid">
        {/* Patient Info */}
        <div className="card">
          <h3 className="card-title mb-4">New Patient Registration</h3>

          <div className="form-stack">
            <div className="field-group">
              <label>Full Name *</label>
              <input placeholder="Patient full name" value={form.name} onChange={e => setF('name', e.target.value)} style={fieldErrors.name ? { borderColor: '#dc2626' } : {}} required />
              {fieldErrors.name && <div className="form-error">{fieldErrors.name}</div>}
            </div>
            <div className="field-group">
              <label>Email</label>
              <input type="email" placeholder="patient@email.com" value={form.email} onChange={e => setF('email', e.target.value)} style={fieldErrors.email ? { borderColor: '#dc2626' } : {}} />
              {fieldErrors.email && <div className="form-error">{fieldErrors.email}</div>}
            </div>
            <div className="field-group">
              <label>Phone *</label>
              <input placeholder="10 digits, e.g. 9876543210" value={form.phone} onChange={e => setF('phone', e.target.value)} style={fieldErrors.phone ? { borderColor: '#dc2626' } : {}} />
              {fieldErrors.phone && <div className="form-error">{fieldErrors.phone}</div>}
            </div>
            <div className="field-group">
              <label>Gender *</label>
              <select value={form.gender} onChange={e => setF('gender', e.target.value)} style={fieldErrors.gender ? { borderColor: '#dc2626' } : {}}>
                <option value="">-- Select Gender --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {fieldErrors.gender && <div className="form-error">{fieldErrors.gender}</div>}
            </div>
            <div className="field-group">
              <label>Date of Birth *</label>
              <input type="date" value={form.dob} onChange={e => setF('dob', e.target.value)} style={fieldErrors.dob ? { borderColor: '#dc2626' } : {}} />
              {fieldErrors.dob && <div className="form-error">{fieldErrors.dob}</div>}
            </div>
            <div className="field-group">
              <label>Blood Group *</label>
              <select value={form.blood_group} onChange={e => setF('blood_group', e.target.value)} style={fieldErrors.blood_group ? { borderColor: '#dc2626' } : {}}>
                <option value="">-- Select Blood Group --</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
              {fieldErrors.blood_group && <div className="form-error">{fieldErrors.blood_group}</div>}
            </div>
          </div>
        </div>

        {/* Appointment Info */}
        <div className="card">
          <h3 className="card-title mb-4">Appointment Details</h3>
          <form onSubmit={handleSubmit} className="form-stack">
            <div className="field-group">
              <label>Select Doctor *</label>
              <select value={form.doctor_id} onChange={e => setF('doctor_id', e.target.value)} style={fieldErrors.doctor_id ? { borderColor: '#dc2626' } : {}} required>
                <option value="">-- Select Doctor --</option>
                {doctors.map(d => (
                  <option key={d._id} value={d._id}>
                    {d.name} — {d.specialization} ({d.queue_count} in queue)
                  </option>
                ))}
              </select>
              {fieldErrors.doctor_id && <div className="form-error">{fieldErrors.doctor_id}</div>}
            </div>

            {/* Smart slot hint */}
            {selectedDoc && (
              <div className={`smart-arrival-banner ${selectedDoc.queue_count > 10 ? '' : ''}`}>
                <Clock size={14} />
                <span>
                  <strong>{selectedDoc.name}</strong> has <strong>{selectedDoc.queue_count}</strong> patients.
                  Est. wait: <strong>~{selectedDoc.queue_count * 10} min</strong>
                  &nbsp;·&nbsp;
                  <span className={`badge ${selectedDoc.status === 'Available' ? 'badge-success' : 'badge-danger'}`}>
                    {selectedDoc.status}
                  </span>
                </span>
              </div>
            )}

            <div className="field-group">
              <label>Reason for Visit *</label>
              <textarea rows={3} placeholder="Describe symptoms or reason..."
                value={form.reason_for_visit} onChange={e => setF('reason_for_visit', e.target.value)} style={fieldErrors.reason_for_visit ? { borderColor: '#dc2626' } : {}} required />
              {fieldErrors.reason_for_visit && <div className="form-error">{fieldErrors.reason_for_visit}</div>}
            </div>

            <div className="field-group">
              <label>Type</label>
              <div className="radio-group">
                {['Normal', 'Emergency'].map(t => (
                  <label key={t} className={`radio-option ${form.type === t ? 'selected' : ''}`}>
                    <input type="radio" value={t} checked={form.type === t} onChange={e => setF('type', e.target.value)} />
                    {t === 'Emergency' ? '🚨 Emergency' : '📋 Normal'}
                  </label>
                ))}
              </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            <button type="submit" className="btn btn-primary w-full" disabled={loading || !form.name}>
              {loading ? 'Booking...' : 'Add to Queue →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
