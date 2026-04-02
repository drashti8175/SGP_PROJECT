import React, { useState, useEffect } from 'react';
import { patientService } from '../../services/api';
import { FileText, ChevronDown, ChevronUp, Calendar, Stethoscope, Pill, Clock, Quote, Activity, Heart } from 'lucide-react';

const HISTORY_QUOTES = [
  { quote: "Every patient carries their own doctor inside them.", author: "Albert Schweitzer" },
  { quote: "The art of medicine consists of amusing the patient while nature cures the disease.", author: "Voltaire" },
  { quote: "Knowing your own darkness is the best method for dealing with the darknesses of other people.", author: "Carl Jung" },
  { quote: "It is health that is real wealth and not pieces of gold and silver.", author: "Mahatma Gandhi" },
];

const randomQuote = HISTORY_QUOTES[Math.floor(Math.random() * HISTORY_QUOTES.length)];

export default function PatientHistoryView() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [tab, setTab] = useState('visits');

  useEffect(() => {
    Promise.all([patientService.getPrescriptions(), patientService.getAppointments()])
      .then(([p, a]) => { setPrescriptions(p); setAppointments(a); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (i) => setExpanded(ex => ({ ...ex, [i]: !ex[i] }));
  const completed = appointments.filter(a => ['Completed', 'completed'].includes(a.status));

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getMainDiag = (p) => {
    const lines = p.diagnosis?.split('\n') || [];
    return lines.find(l => l.startsWith('[A]'))?.replace('[A] ', '') || p.diagnosis || 'General Consultation';
  };

  if (loading) return (
    <div className="page-loading">
      <div className="spinner" />
      <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>Loading your medical history...</p>
    </div>
  );

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title"><FileText size={22} /> Medical History</h1>
          <p className="page-sub">Your complete health journey</p>
        </div>
      </div>

      {/* Quote Banner */}
      <div className="health-quote-banner" style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a8a)' }}>
        <Quote size={28} className="quote-icon" style={{ color: '#60a5fa' }} />
        <div>
          <p className="quote-text" style={{ color: 'white' }}>"{randomQuote.quote}"</p>
          <p className="quote-author" style={{ color: 'rgba(255,255,255,0.6)' }}>— {randomQuote.author}</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="history-summary-row">
        <div className="history-summary-card">
          <Activity size={20} className="text-primary" />
          <div>
            <h3 className="fw-800">{appointments.length}</h3>
            <p className="text-muted text-xs">Total Visits</p>
          </div>
        </div>
        <div className="history-summary-card">
          <Stethoscope size={20} style={{ color: '#10b981' }} />
          <div>
            <h3 className="fw-800">{completed.length}</h3>
            <p className="text-muted text-xs">Completed</p>
          </div>
        </div>
        <div className="history-summary-card">
          <Pill size={20} style={{ color: '#7c3aed' }} />
          <div>
            <h3 className="fw-800">{prescriptions.length}</h3>
            <p className="text-muted text-xs">Prescriptions</p>
          </div>
        </div>
        <div className="history-summary-card">
          <Heart size={20} style={{ color: '#dc2626' }} />
          <div>
            <h3 className="fw-800">{[...new Set(prescriptions.map(p => p.doctor_name))].length}</h3>
            <p className="text-muted text-xs">Doctors Seen</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="filter-tabs">
        <button className={`filter-tab ${tab === 'prescriptions' ? 'active' : ''}`} onClick={() => setTab('prescriptions')}>
          💊 Prescriptions ({prescriptions.length})
        </button>
        <button className={`filter-tab ${tab === 'visits' ? 'active' : ''}`} onClick={() => setTab('visits')}>
          📅 All Visits ({appointments.length})
        </button>
      </div>

      {/* ── PRESCRIPTIONS TAB ── */}
      {tab === 'prescriptions' && (
        <div className="card">
          <h3 className="card-title mb-4">💊 All Prescriptions</h3>
          {prescriptions.length === 0 ? (
            <div className="history-empty">
              <div className="history-empty-icon">💊</div>
              <h3>No Prescriptions Yet</h3>
              <p className="text-muted">Prescriptions from your doctor will appear here.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Date</th><th>Doctor</th><th>Diagnosis</th><th>Medicines</th><th>Follow-up</th></tr>
              </thead>
              <tbody>
                {prescriptions.map((p, i) => {
                  const followUpMatch = p.notes?.match(/Follow-up: (\S+)/);
                  const isOverdue = followUpMatch && new Date(followUpMatch[1]) < new Date();
                  return (
                    <tr key={i}>
                      <td className="text-muted">{i + 1}</td>
                      <td className="fw-600">{formatDate(p.created_at || p.createdAt)}</td>
                      <td>Dr. {p.doctor_name}</td>
                      <td className="fw-600">{getMainDiag(p)}</td>
                      <td>
                        <div className="meds-list">
                          {p.medicines?.slice(0, 2).map((m, j) => (
                            <span key={j} className="med-tag">{m.name}</span>
                          ))}
                          {p.medicines?.length > 2 && <span className="text-muted text-xs">+{p.medicines.length - 2}</span>}
                        </div>
                      </td>
                      <td>
                        {followUpMatch
                          ? <span className={`badge ${isOverdue ? 'badge-danger' : 'badge-warning'}`}>{followUpMatch[1]}</span>
                          : <span className="text-muted text-xs">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── VISITS TAB ── */}
      {tab === 'visits' && (
        <div className="card">
          <h3 className="card-title mb-4">📅 All Visits</h3>
          {appointments.length === 0 ? (
            <div className="history-empty">
              <div className="history-empty-icon">🏥</div>
              <h3>No Visits Yet</h3>
              <p className="text-muted">Book your first appointment to get started.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Date</th><th>Doctor</th><th>Specialty</th><th>Reason</th><th>Status</th></tr>
              </thead>
              <tbody>
                {appointments.map((a, i) => (
                  <tr key={a.id}>
                    <td className="text-muted">{i + 1}</td>
                    <td className="fw-600">{a.date}</td>
                    <td>{a.doctor_name}</td>
                    <td className="text-muted">{a.specialty}</td>
                    <td className="text-muted text-sm">{a.reason_for_visit}</td>
                    <td>
                      <span className={`badge ${
                        ['Completed','completed'].includes(a.status) ? 'badge-success' :
                        ['Waiting','confirmed'].includes(a.status) ? 'badge-warning' :
                        a.status === 'In-Consultation' ? 'badge-info' : 'badge-danger'
                      }`}>{a.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
