import React, { useState } from 'react';
import { receptionistService } from '../../services/api';
import { Search, Users, Clock, Pill, AlertTriangle, ChevronDown, ChevronUp, Calendar } from 'lucide-react';

const statusBadge = s => {
  if (s === 'pending') return 'badge-pending';
  if (s === 'confirmed') return 'badge-success';
  if (s === 'Waiting') return 'badge-warning';
  if (s === 'In-Consultation') return 'badge-info';
  if (['Completed','completed'].includes(s)) return 'badge-info';
  return 'badge-danger';
};

export default function PatientSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [histLoading, setHistLoading] = useState(false);
  const [tab, setTab] = useState('appointments');
  const [expanded, setExpanded] = useState({});

  const search = async (q) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await receptionistService.searchPatients(q);
      setResults(data);
    } catch (e) { } finally { setLoading(false); }
  };

  const selectPatient = async (p) => {
    setSelected(p);
    setResults([]);
    setQuery(p.name);
    setHistory(null);
    setHistLoading(true);
    try {
      const data = await receptionistService.getPatientHistory(p._id);
      setHistory(data);
    } catch (e) { setHistory({ patient: p, appointments: [], prescriptions: [] }); }
    finally { setHistLoading(false); }
  };

  const toggle = (i) => setExpanded(e => ({ ...e, [i]: !e[i] }));

  const getMainDiag = (diag) => {
    const lines = diag?.split('\n') || [];
    return lines.find(l => l.startsWith('[A]'))?.replace('[A] ', '') || diag || 'General';
  };

  const calcAge = (dob) => dob ? new Date().getFullYear() - new Date(dob).getFullYear() : null;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Search size={22} /> Patient Search</h1>
          <p className="page-sub">Search patient history, appointments and prescriptions</p>
        </div>
      </div>

      {/* Search Box */}
      <div className="card max-w-xl" style={{ position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input style={{ paddingLeft: 40, width: '100%', padding: '12px 12px 12px 40px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 15, outline: 'none' }}
            placeholder="Search by name, email or phone..."
            value={query} onChange={e => search(e.target.value)} />
        </div>
        {loading && <p className="text-muted text-sm mt-2">Searching...</p>}
        {results.length > 0 && (
          <div className="search-dropdown">
            {results.map(p => (
              <div key={p._id} className="search-dropdown-item" onClick={() => selectPatient(p)}>
                <div className="patient-avatar">{p.name?.charAt(0)}</div>
                <div>
                  <p className="fw-600">{p.name}</p>
                  <p className="text-muted text-xs">{p.email} {p.phone && `· ${p.phone}`}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Patient Details + History */}
      {histLoading && <div className="page-loading"><div className="spinner" /></div>}

      {history && !histLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Patient Profile Card */}
          <div className="card">
            <div className="detail-avatar-row mb-4">
              <div className="detail-avatar">{history.patient?.name?.charAt(0)}</div>
              <div>
                <h2 className="fw-800">{history.patient?.name}</h2>
                <p className="text-muted">{history.patient?.email}</p>
                {history.patient?.phone && <p className="text-muted text-sm">{history.patient.phone}</p>}
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {history.patient?.blood_group && <span className="badge badge-danger">🩸 {history.patient.blood_group}</span>}
                {history.patient?.gender && <span className="badge badge-info">{history.patient.gender}</span>}
                {calcAge(history.patient?.dob) && <span className="badge badge-info">{calcAge(history.patient.dob)} yrs</span>}
              </div>
            </div>

            {/* Summary Stats */}
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

            {/* Emergency flag */}
            {history.appointments?.some(a => a.type === 'Emergency') && (
              <div className="risk-item risk-warning mt-3">
                <AlertTriangle size={15} /> This patient has emergency visit history — handle with care
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="filter-tabs">
            <button className={`filter-tab ${tab === 'appointments' ? 'active' : ''}`} onClick={() => setTab('appointments')}>
              📅 Appointments ({history.appointments?.length || 0})
            </button>
            <button className={`filter-tab ${tab === 'prescriptions' ? 'active' : ''}`} onClick={() => setTab('prescriptions')}>
              💊 Prescriptions ({history.prescriptions?.length || 0})
            </button>
          </div>

          {/* Appointments Tab */}
          {tab === 'appointments' && (
            <div className="card">
              <h3 className="card-title mb-4">📅 Visit History</h3>
              {history.appointments?.length === 0 ? (
                <div className="empty-state"><Calendar size={40} /><p>No appointments found</p></div>
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
                        <td className="text-muted text-sm" style={{ maxWidth: 180 }}>{a.reason_for_visit}</td>
                        <td><span className={`badge ${a.type === 'Emergency' ? 'badge-danger' : 'badge-info'}`}>{a.type || 'Normal'}</span></td>
                        <td><span className={`badge ${statusBadge(a.status)}`}>{a.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Prescriptions Tab */}
          {tab === 'prescriptions' && (
            <div className="card">
              <h3 className="card-title mb-4">💊 Prescription History</h3>
              {history.prescriptions?.length === 0 ? (
                <div className="empty-state"><Pill size={40} /><p>No prescriptions found</p></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {history.prescriptions.map((p, i) => (
                    <div key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                      <div className="prescription-card-header" onClick={() => toggle(i)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div className="rx-circle">Rx</div>
                          <div>
                            <p className="fw-700">{getMainDiag(p.diagnosis)}</p>
                            <p className="text-muted text-sm">Dr. {p.doctor_name} · {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="badge badge-info">{p.medicines?.length || 0} medicines</span>
                          {expanded[i] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                      {expanded[i] && (
                        <div className="prescription-card-body">
                          {/* Medicines */}
                          {p.medicines?.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs fw-700 text-muted uppercase mb-2">Medicines</p>
                              <table className="data-table">
                                <thead><tr><th>Medicine</th><th>Dosage</th><th>Duration</th></tr></thead>
                                <tbody>
                                  {p.medicines.map((m, j) => (
                                    <tr key={j}>
                                      <td className="fw-600">{m.name}</td>
                                      <td>{m.dosage}</td>
                                      <td>{m.duration}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                          {p.notes && (
                            <p className="text-muted text-sm">📝 {p.notes.replace(/Lab Tests:.*/, '').replace(/Follow-up:.*/, '').trim()}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
