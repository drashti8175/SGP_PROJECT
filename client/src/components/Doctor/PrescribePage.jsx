import React, { useState, useEffect } from 'react';
import { doctorService } from '../../services/api';
import { FileText, Plus, Trash2, Save, FlaskConical, Calendar, User, Quote } from 'lucide-react';

const auditLog = (action) => {
  const logs = JSON.parse(sessionStorage.getItem('auditLogs') || '[]');
  logs.unshift({ action, time: new Date().toLocaleTimeString(), module: 'Doctor' });
  sessionStorage.setItem('auditLogs', JSON.stringify(logs.slice(0, 20)));
};

export default function PrescribePage() {
  const [queue, setQueue] = useState([]);
  const [selectedAppt, setSelectedAppt] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [form, setForm] = useState({
    subjective: '', objective: '', diagnosis: '', plan: '',
    medicines: [{ name: '', dosage: '', duration: '' }],
    labTests: [], labInput: '', followUpDate: '', notes: '',
  });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load ALL patients in queue (waiting + in-consultation)
    doctorService.getQueue().then(q => {
      setQueue(q);
      // Auto-select in-consultation patient
      const active = q.find(p => p.status === 'In-Consultation');
      if (active) {
        setSelectedAppt(active.id);
        setSelectedPatient(active);
      }
    }).catch(() => {});
  }, []);

  const handlePatientSelect = (e) => {
    const id = e.target.value;
    setSelectedAppt(id);
    const p = queue.find(q => q.id === id);
    setSelectedPatient(p || null);
  };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const addMed = () => setF('medicines', [...form.medicines, { name: '', dosage: '', duration: '' }]);
  const removeMed = (i) => setF('medicines', form.medicines.filter((_, idx) => idx !== i));
  const setMed = (i, k, v) => { const m = [...form.medicines]; m[i] = { ...m[i], [k]: v }; setF('medicines', m); };
  const addLab = () => { if (!form.labInput.trim()) return; setF('labTests', [...form.labTests, form.labInput.trim()]); setF('labInput', ''); };
  const removeLab = (i) => setF('labTests', form.labTests.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppt) return setMsg('❌ Please select a patient first.');
    if (!form.diagnosis.trim()) return setMsg('❌ Diagnosis (Assessment) is required.');
    if (form.medicines.some(m => !m.name.trim())) return setMsg('❌ Please fill all medicine names.');
    setLoading(true);
    try {
      const patientId = selectedPatient?.patient_id || selectedPatient?.id;
      const diagnosisText = form.subjective || form.objective || form.plan
        ? `[S] ${form.subjective}\n[O] ${form.objective}\n[A] ${form.diagnosis}\n[P] ${form.plan}`
        : form.diagnosis;

      const notesText = [
        form.notes,
        form.labTests.length ? 'Lab Tests: ' + form.labTests.join(', ') : '',
        form.followUpDate ? 'Follow-up: ' + form.followUpDate : ''
      ].filter(Boolean).join('\n');

      await doctorService.prescribe({
        appointment_id: selectedAppt,
        patient_id: patientId,
        diagnosis: diagnosisText,
        medicines: form.medicines.filter(m => m.name.trim()),
        notes: notesText,
      });
      auditLog(`Prescription saved for: ${selectedPatient?.patient_name}`);
      setMsg('✅ Prescription saved and sent to patient!');
      setForm({ subjective: '', objective: '', diagnosis: '', plan: '', medicines: [{ name: '', dosage: '', duration: '' }], labTests: [], labInput: '', followUpDate: '', notes: '' });
      setSelectedAppt('');
      setSelectedPatient(null);
      // Refresh queue
      doctorService.getQueue().then(setQueue).catch(() => {});
    } catch (e) {
      setMsg('❌ ' + (e.response?.data?.error || 'Failed to save prescription.'));
    } finally { setLoading(false); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><FileText size={22} /> Write Prescription</h1>
          <p className="page-sub">EMR — SOAP Format · Digital prescription sent to patient</p>
        </div>
      </div>

      {/* Quote */}
      <div className="doctor-quote-bar">
        <Quote size={14} />
        <em className="text-sm">"First, do no harm." — Hippocrates</em>
      </div>

      {/* Patient Selector */}
      <div className="card">
        <h3 className="card-title mb-3"><User size={18} /> Select Patient</h3>
        <div className="field-group">
          <label>Choose from today's queue</label>
          <select value={selectedAppt} onChange={handlePatientSelect} required
            style={{ fontSize: 15, padding: '12px 14px' }}>
            <option value="">-- Select Patient from Queue --</option>
            {queue.map(p => (
              <option key={p.id} value={p.id}>
                #{p.token_number} — {p.patient_name} ({p.status}) {p.type === 'Emergency' ? '🚨' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Selected patient info */}
        {selectedPatient && (
          <div className="selected-patient-info mt-3">
            <div className="spi-avatar">{selectedPatient.patient_name?.charAt(0)}</div>
            <div>
              <p className="fw-700">{selectedPatient.patient_name}</p>
              <p className="text-muted text-sm">{selectedPatient.reason || 'General Checkup'}</p>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <span className="token-num">#{selectedPatient.token_number}</span>
              <span className={`badge ${selectedPatient.status === 'In-Consultation' ? 'badge-success' : 'badge-warning'}`}>
                {selectedPatient.status}
              </span>
            </div>
          </div>
        )}

        {queue.length === 0 && (
          <div className="alert alert-danger mt-3">
            No patients in queue. Ask receptionist to check-in patients first.
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="prescription-form-layout">
        {/* Left: SOAP Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 className="card-title mb-3">📋 SOAP Clinical Notes</h3>
            <div className="form-stack">
              <div className="field-group">
                <label style={{ color: '#3b82f6' }}>S — Subjective (Patient's complaint)</label>
                <textarea rows={2} placeholder="What the patient reports — pain, duration, severity..."
                  value={form.subjective} onChange={e => setF('subjective', e.target.value)} />
              </div>
              <div className="field-group">
                <label style={{ color: '#10b981' }}>O — Objective (Examination findings)</label>
                <textarea rows={2} placeholder="Vitals, physical exam, test results..."
                  value={form.objective} onChange={e => setF('objective', e.target.value)} />
              </div>
              <div className="field-group">
                <label style={{ color: '#f59e0b' }}>A — Assessment (Diagnosis) *</label>
                <textarea rows={2} placeholder="Your clinical diagnosis..."
                  value={form.diagnosis} onChange={e => setF('diagnosis', e.target.value)} required />
              </div>
              <div className="field-group">
                <label style={{ color: '#8b5cf6' }}>P — Plan (Treatment)</label>
                <textarea rows={2} placeholder="Treatment plan, referrals, lifestyle changes..."
                  value={form.plan} onChange={e => setF('plan', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Medicines + Labs + Follow-up */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Medicines */}
          <div className="card">
            <div className="flex-between mb-3">
              <h3 className="card-title">💊 Medicines</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={addMed}><Plus size={14} /> Add</button>
            </div>
            {form.medicines.map((med, i) => (
              <div key={i} className="med-row mb-2">
                <input placeholder="Medicine name" value={med.name} onChange={e => setMed(i, 'name', e.target.value)} required />
                <input placeholder="Dosage (e.g. 500mg)" value={med.dosage} onChange={e => setMed(i, 'dosage', e.target.value)} required />
                <input placeholder="Duration (e.g. 5 days)" value={med.duration} onChange={e => setMed(i, 'duration', e.target.value)} required />
                {form.medicines.length > 1 && (
                  <button type="button" className="btn btn-xs btn-danger" onClick={() => removeMed(i)}><Trash2 size={12} /></button>
                )}
              </div>
            ))}
          </div>

          {/* Lab Tests */}
          <div className="card">
            <h3 className="card-title mb-3"><FlaskConical size={16} /> Lab Tests</h3>
            <div className="search-row mb-2">
              <input placeholder="e.g. CBC, Blood Sugar, X-Ray, ECG..."
                value={form.labInput} onChange={e => setF('labInput', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLab())} />
              <button type="button" className="btn btn-sm btn-outline" onClick={addLab}><Plus size={14} /></button>
            </div>
            <div className="meds-list">
              {form.labTests.map((t, i) => (
                <span key={i} className="lab-tag">🧪 {t}
                  <button type="button" onClick={() => removeLab(i)}>×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Follow-up */}
          <div className="card">
            <h3 className="card-title mb-3"><Calendar size={16} /> Follow-up & Advice</h3>
            <div className="form-stack">
              <div className="field-group">
                <label>Follow-up Date</label>
                <input type="date" value={form.followUpDate} onChange={e => setF('followUpDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="field-group">
                <label>Doctor's Advice</label>
                <textarea rows={2} placeholder="Rest, diet, lifestyle advice, precautions..."
                  value={form.notes} onChange={e => setF('notes', e.target.value)} />
              </div>
            </div>
          </div>

          {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-danger'}`}>{msg}</div>}
          <button type="submit" className="btn btn-primary w-full" disabled={loading || !selectedAppt}>
            <Save size={16} /> {loading ? 'Saving...' : 'Save & Send Prescription to Patient'}
          </button>
        </div>
      </form>
    </div>
  );
}
