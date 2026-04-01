import React, { useState, useEffect } from 'react';
import { receptionistService } from '../../services/api';
import { CalendarPlus, Search, Clock, CheckCircle2 } from 'lucide-react';

export default function WalkInBooking() {
  const [doctors, setDoctors] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', doctor_id: '', reason_for_visit: '', type: 'Normal' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => { receptionistService.getDoctors().then(setDoctors).catch(console.error); }, []);

  const searchPatients = async (q) => {
    setSearchQ(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await receptionistService.searchPatients(q);
      setSearchResults(res);
    } catch (e) { } finally { setSearching(false); }
  };

  const fillPatient = (p) => {
    setForm(f => ({ ...f, name: p.name, email: p.email, phone: p.phone || '' }));
    setSearchQ(p.name);
    setSearchResults([]);
  };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await receptionistService.walkIn(form);
      setResult(data);
      setForm({ name: '', email: '', phone: '', doctor_id: '', reason_for_visit: '', type: 'Normal' });
      setSearchQ('');
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
          <p className="page-sub">Register walk-in patients directly at reception</p>
        </div>
      </div>

      <div className="two-col-grid">
        {/* Patient Info */}
        <div className="card">
          <h3 className="card-title mb-4">Patient Information</h3>

          {/* Search existing */}
          <div className="field-group mb-4" style={{ position: 'relative' }}>
            <label>Search Existing Patient</label>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input style={{ paddingLeft: 36 }} placeholder="Search by name, email, phone..."
                value={searchQ} onChange={e => searchPatients(e.target.value)} />
            </div>
            {searchResults.length > 0 && (
              <div className="search-dropdown">
                {searchResults.map(p => (
                  <div key={p._id} className="search-dropdown-item" onClick={() => fillPatient(p)}>
                    <div className="patient-avatar" style={{ width: 28, height: 28, fontSize: 12 }}>{p.name?.charAt(0)}</div>
                    <div>
                      <p className="fw-600 text-sm">{p.name}</p>
                      <p className="text-muted text-xs">{p.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-stack">
            <div className="field-group">
              <label>Full Name *</label>
              <input placeholder="Patient full name" value={form.name} onChange={e => setF('name', e.target.value)} required />
            </div>
            <div className="field-group">
              <label>Email</label>
              <input type="email" placeholder="patient@email.com" value={form.email} onChange={e => setF('email', e.target.value)} />
            </div>
            <div className="field-group">
              <label>Phone</label>
              <input placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={e => setF('phone', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Appointment Info */}
        <div className="card">
          <h3 className="card-title mb-4">Appointment Details</h3>
          <form onSubmit={handleSubmit} className="form-stack">
            <div className="field-group">
              <label>Select Doctor *</label>
              <select value={form.doctor_id} onChange={e => setF('doctor_id', e.target.value)} required>
                <option value="">-- Select Doctor --</option>
                {doctors.map(d => (
                  <option key={d._id} value={d._id}>
                    {d.name} — {d.specialization} ({d.queue_count} in queue)
                  </option>
                ))}
              </select>
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
                value={form.reason_for_visit} onChange={e => setF('reason_for_visit', e.target.value)} required />
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
