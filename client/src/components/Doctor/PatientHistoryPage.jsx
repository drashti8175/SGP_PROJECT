import React, { useState, useEffect } from 'react';
import { doctorService } from '../../services/api';
import { Users, Search, ChevronDown, ChevronUp, Calendar, Pill, AlertTriangle, Clock } from 'lucide-react';

export default function PatientHistoryPage() {
  const [queue, setQueue] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('appointments');
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    doctorService.getQueue().then(q => {
      setQueue(q);
      // Auto-select in-consultation patient
      const active = q.find(p => p.status === 'In-Consultation');
      if (active?.patient_id) fetchHistory(active.patient_id);
    }).catch(() => {});
  }, []);

  const fetchHistory = async (pid) => {
    if (!pid) return;
    setPatientId(pid);
    setLoading(true);
    try {
      const data = await doctorService.getPatientHistory(pid);
      setHistory(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggle = (i) => setExpanded(e => ({ ...e, [i]: !e[i] }));

  const getMainDiag = (diag) => {
    const lines = diag?.split('\n') || [];
    return lines.find(l => l.startsWith('[A]'))?.replace('[A] ', '') || diag || 'General Consultation';
  };

  const calcAge = (dob) => dob ? new Date().getFullYear() - new Date(dob).getFullYear() : null;

  const statusBadge = s => {
    if (['Completed','completed'].includes(s)) return 'badge-info';
    if (s === 'Waiting') return 'badge-warning';
    if (s === 'In-Consultation') return 'badge-success';
    return 'badge-danger';
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Users size={22} /> Patient History</h1>
          <p className="page-sub">Full medical history — appointments & prescriptions</p>
        </div>
      </div>

      {/* Patient Selector */}
      <div className="card max-w-xl">
        <h3 className="card-title mb-3">Select Patient</h3>
        <div className="field-group">
          <label>Choose from today's queue</label>
          <select value={patientId} onChange={e => fetchHistory(e.target.value)}>
            <option value="">-- Select Patient --</option>
            {queue.map(p => (
              <option key={p.id} value={p.patient_id}>
                #{p.token_number} — {p.patient_name} ({p.status})
              </option>
            ))}
          </select>
        </div>
        {queue.length === 0 && (
          <p className="text-muted text-sm mt-2">No patients in queue today</p>
        )}
      </div>

      {loading && <div className="page-loading"><div className="spinner" /></div>}

      {history && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Patient Profile */}
          <div className="card">
            <div className="detail-avatar-row mb-4">
              <div className="detail-avatar">{history.patient?.name?.charAt(0)}</div>
              <div>
                <h2 className="fw-800">{history.patient?.name || 'Unknown'}</h2>
                <p className="text-muted">{history.patient?.email}</p>
                {history.patient?.phone && <p className="text-muted text-sm">{history.patient.phone}</p>}
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {history.patient?.blood_group && <span className="badge badge-danger">🩸 {history.patient.blood_group}</span>}
                {history.patient?.gender && <span className="badge badge-info">{history.patient.gender}</span>}
                {calcAge(history.patient?.dob) && <span className="badge badge-info">{calcAge(history.patient.dob)} yrs</span>}
              </div>
            </div>

            {/* Summary */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
              <div className="stat-card">
                <div className="stat-icon"><Calendar size={18} /></div>
                <div><p className="stat-label">Total Visits</p><h2 className="stat-value">{history.appointments?.length || 0}</h2></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><Pill size={18} /></div>
                <div><p className="stat-label">Prescriptions</p><h2 className="stat-value">{history.prescriptions?.length || 0}</h2></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><Clock size={18} /></div>
                <div><p className="stat-label">Last Visit</p><h2 className="stat-value" style={{ fontSize: 14 }}>{history.appointments?.[0]?.date || 'N/A'}</h2></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><AlertTriangle size={18} /></div>
                <div><p className="stat-label">Emergency</p><h2 className="stat-value">{history.appointments?.filter(a => a.type === 'Emergency').length || 0}</h2></div>
              </div>
            </div>

            {/* Risk flags */}
            {history.appointments?.some(a => a.type === 'Emergency') && (
              <div className="risk-item risk-warning mt-3">
                <AlertTriangle size={15} /> Emergency visit history — review carefully before prescribing
              </div>
            )}
            {history.prescriptions?.some(p => p.notes?.toLowerCase().includes('allerg')) && (
              <div className="risk-item risk-critical mt-2">
                <AlertTriangle size={15} /> Possible allergy noted in previous prescriptions
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="filter-tabs">
            <button className={`filter-tab ${tab === 'appointments' ? 'active' : ''}`} onClick={() => setTab('appointments')}>
              📅 All Visits ({history.appointments?.length || 0})
            </button>
            <button className={`filter-tab ${tab === 'prescriptions' ? 'active' : ''}`} onClick={() => setTab('prescriptions')}>
              💊 Prescriptions ({history.prescriptions?.length || 0})
            </button>
          </div>

          {/* Appointments */}
          {tab === 'appointments' && (
            <div className="card">
              {history.appointments?.length === 0 ? (
                <div className="empty-state"><Calendar size={40} /><p>No visit history found</p></div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th>Date</th><th>Token</th><th>Doctor</th><th>Reason</th><th>Type</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {history.appointments.map((a, i) => (
                      <tr key={i} className={a.type === 'Emergency' ? 'row-emergency' : ''}>
                        <td className="fw-600">{a.date}</td>
                        <td><span className="token-num">#{a.token_number}</span></td>
                        <td>{a.doctor_name}</td>
                        <td className="text-muted text-sm">{a.reason_for_visit}</td>
                        <td><span className={`badge ${a.type === 'Emergency' ? 'badge-danger' : 'badge-info'}`}>{a.type || 'Normal'}</span></td>
                        <td><span className={`badge ${statusBadge(a.status)}`}>{a.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Prescriptions */}
          {tab === 'prescriptions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {history.prescriptions?.length === 0 ? (
                <div className="card"><div className="empty-state"><Pill size={40} /><p>No prescriptions found</p></div></div>
              ) : (
                history.prescriptions.map((p, i) => (
                  <div key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="prescription-card-header" onClick={() => toggle(i)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div className="rx-circle">Rx</div>
                        <div>
                          <p className="fw-700">{getMainDiag(p.diagnosis)}</p>
                          <p className="text-muted text-sm">
                            Dr. {p.doctor_name} · {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="badge badge-info">{p.medicines?.length || 0} medicines</span>
                        {expanded[i] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                    {expanded[i] && (
                      <div className="prescription-card-body">
                        {/* SOAP */}
                        {p.diagnosis?.includes('[S]') && (
                          <div className="soap-box mb-3">
                            {p.diagnosis.split('\n').map((l, j) => {
                              if (!l) return null;
                              const colors = { '[S]': '#3b82f6', '[O]': '#10b981', '[A]': '#f59e0b', '[P]': '#8b5cf6' };
                              const key = Object.keys(colors).find(k => l.startsWith(k));
                              return (
                                <div key={j} className="soap-row" style={{ borderLeftColor: key ? colors[key] : '#e2e8f0' }}>
                                  <span className="soap-key" style={{ color: key ? colors[key] : 'var(--text-muted)' }}>{key || '  '}</span>
                                  <span className="soap-val">{l.replace(/^\[.\] /, '')}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {/* Medicines */}
                        {p.medicines?.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs fw-700 text-muted uppercase mb-2">Medicines</p>
                            <div className="med-cards-grid">
                              {p.medicines.map((m, j) => (
                                <div key={j} className="med-detail-card">
                                  <div className="mdc-top">
                                    <div className="mdc-icon">💊</div>
                                    <div><p className="fw-700">{m.name}</p></div>
                                  </div>
                                  <div className="mdc-info">
                                    <div className="mdc-row"><span>Dosage</span><span className="fw-600">{m.dosage}</span></div>
                                    <div className="mdc-row"><span>Duration</span><span className="fw-600">{m.duration}</span></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {p.notes && (
                          <p className="text-muted text-sm">📝 {p.notes.replace(/Lab Tests:.*/, '').replace(/Follow-up:.*/, '').trim()}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
