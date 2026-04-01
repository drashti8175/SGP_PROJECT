import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorService } from '../../services/api';
import { User, AlertTriangle, Shield, FileText, Clock, CheckCircle2, Activity } from 'lucide-react';

// CDSS: detect risk flags from patient data
function detectRisks(patient, history) {
  const risks = [];
  if (patient?.blood_group === 'AB-') risks.push({ level: 'info', msg: 'Rare blood group — note for emergencies' });
  if (history?.some(h => h.diagnosis?.toLowerCase().includes('diabetes')))
    risks.push({ level: 'warning', msg: 'Diabetic patient — check sugar levels' });
  if (history?.some(h => h.diagnosis?.toLowerCase().includes('hypertension') || h.diagnosis?.toLowerCase().includes('bp')))
    risks.push({ level: 'warning', msg: 'Hypertension history — monitor BP' });
  if (history?.some(h => h.medicines?.some(m => m.name?.toLowerCase().includes('penicillin'))))
    risks.push({ level: 'critical', msg: 'Possible Penicillin allergy — verify before prescribing' });
  return risks;
}

export default function PatientDetails() {
  const navigate = useNavigate();
  const [patientId, setPatientId] = useState('');
  const [apptId, setApptId] = useState('');
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    doctorService.getQueue().then(q => {
      setQueue(q);
      const active = q.find(p => p.status === 'In-Consultation');
      if (active) { setPatientId(active.patient_id); setApptId(active.id); }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    Promise.all([
      doctorService.getPatient(patientId),
      doctorService.getPatientHistory(patientId)
    ]).then(([p, h]) => {
      setPatient(p);
      setHistory(h);
      setRisks(detectRisks(p, h));
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, [patientId]);

  const age = (dob) => dob ? new Date().getFullYear() - new Date(dob).getFullYear() : 'N/A';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><User size={22} /> Patient Details</h1>
          <p className="page-sub">Full patient profile before consultation</p>
        </div>
      </div>

      {/* Patient selector */}
      <div className="card max-w-xl">
        <div className="field-group">
          <label>Select Patient from Queue</label>
          <select value={patientId} onChange={e => {
            const sel = queue.find(q => q.patient_id === e.target.value);
            setPatientId(e.target.value);
            setApptId(sel?.id || '');
          }}>
            <option value="">-- Select --</option>
            {queue.map(p => (
              <option key={p.id} value={p.patient_id}>
                #{p.token_number} — {p.patient_name} ({p.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="page-loading"><div className="spinner" /></div>}

      {patient && !loading && (
        <div className="patient-details-grid">
          {/* Personal Info */}
          <div className="card">
            <h3 className="card-title mb-4"><User size={18} /> Personal Information</h3>
            <div className="detail-avatar-row">
              <div className="detail-avatar">{patient.name?.charAt(0)}</div>
              <div>
                <h2 className="fw-800">{patient.name}</h2>
                <p className="text-muted">{patient.email}</p>
              </div>
            </div>
            <div className="detail-grid mt-4">
              <DetailItem label="Age" value={age(patient.dob)} />
              <DetailItem label="Gender" value={patient.gender || 'N/A'} />
              <DetailItem label="Blood Group" value={patient.blood_group || 'N/A'} />
              <DetailItem label="Phone" value={patient.phone || 'N/A'} />
              <DetailItem label="Last Visit" value={patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : 'N/A'} />
            </div>
          </div>

          {/* CDSS Risk Panel */}
          <div className="card">
            <h3 className="card-title mb-4"><Shield size={18} /> Clinical Decision Support</h3>
            {risks.length === 0 ? (
              <div className="cdss-ok">
                <CheckCircle2 size={32} className="text-success" />
                <p className="fw-600 text-success">No risk flags detected</p>
                <p className="text-muted text-sm">Patient appears safe to proceed</p>
              </div>
            ) : (
              <div className="risk-list">
                {risks.map((r, i) => (
                  <div key={i} className={`risk-item risk-${r.level}`}>
                    <AlertTriangle size={16} />
                    <span>{r.msg}</span>
                  </div>
                ))}
              </div>
            )}

            <h4 className="fw-600 mt-4 mb-2">Visit History Summary</h4>
            <div className="detail-grid">
              <DetailItem label="Total Visits" value={history.length} />
              <DetailItem label="Last Diagnosis" value={history[0]?.diagnosis || 'N/A'} />
            </div>
          </div>

          {/* Current Complaint */}
          <div className="card">
            <h3 className="card-title mb-4"><Activity size={18} /> Current Complaint</h3>
            {queue.find(q => q.patient_id === patientId) ? (
              <div>
                <div className="complaint-box">
                  <p>{queue.find(q => q.patient_id === patientId)?.reason || 'General Checkup'}</p>
                </div>
                <div className="detail-grid mt-3">
                  <DetailItem label="Type" value={queue.find(q => q.patient_id === patientId)?.type || 'Normal'} />
                  <DetailItem label="Risk Level" value={queue.find(q => q.patient_id === patientId)?.risk_level || 'Low'} />
                </div>
              </div>
            ) : <p className="text-muted">No active appointment</p>}

            {/* Action Buttons */}
            <div className="action-row mt-4">
              <button className="btn btn-primary" onClick={() => navigate('/doctor/prescribe')}>
                <FileText size={15} /> Add Prescription
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/doctor/history')}>
                <Clock size={15} /> View History
              </button>
              {apptId && (
                <button className="btn btn-success" onClick={async () => {
                  await doctorService.completeConsultation(apptId);
                  navigate('/doctor/queue');
                }}>
                  <CheckCircle2 size={15} /> Mark Completed
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const DetailItem = ({ label, value }) => (
  <div className="detail-item">
    <p className="text-xs text-muted fw-600 uppercase">{label}</p>
    <p className="fw-600">{value}</p>
  </div>
);
