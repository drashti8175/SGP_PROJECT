import React, { useState, useEffect } from 'react';
import { patientService } from '../../services/api';
import { Pill, ChevronDown, ChevronUp, Calendar, FlaskConical, Search, Quote, Stethoscope, Clock, User } from 'lucide-react';

const HEALTH_QUOTES = [
  { quote: "The greatest wealth is health.", author: "Virgil" },
  { quote: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
  { quote: "Health is not valued till sickness comes.", author: "Thomas Fuller" },
  { quote: "An apple a day keeps the doctor away.", author: "Proverb" },
  { quote: "Your body hears everything your mind says.", author: "Naomi Judd" },
  { quote: "A healthy outside starts from the inside.", author: "Robert Urich" },
];

const randomQuote = HEALTH_QUOTES[Math.floor(Math.random() * HEALTH_QUOTES.length)];

export default function MyPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    patientService.getPrescriptions()
      .then(setPrescriptions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (i) => setExpanded(ex => ({ ...ex, [i]: !ex[i] }));

  const filtered = prescriptions.filter(p => {
    const q = search.toLowerCase();
    return !q || p.diagnosis?.toLowerCase().includes(q) || p.doctor_name?.toLowerCase().includes(q);
  });

  const formatDate = (p) => {
    const d = p.date || p.created_at || p.createdAt;
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
      <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>Loading your prescriptions...</p>
    </div>
  );

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title"><Pill size={22} /> My Prescriptions</h1>
          <p className="page-sub">{prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''} on record</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="search-input" style={{ paddingLeft: 36 }}
            placeholder="Search diagnosis or doctor..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Health Quote Banner */}
      <div className="health-quote-banner">
        <Quote size={28} className="quote-icon" />
        <div>
          <p className="quote-text">"{randomQuote.quote}"</p>
          <p className="quote-author">— {randomQuote.author}</p>
        </div>
      </div>

      {/* Stats Row */}
      {prescriptions.length > 0 && (
        <div className="presc-stats-row">
          <div className="presc-stat">
            <Pill size={16} />
            <span><strong>{prescriptions.length}</strong> Total Prescriptions</span>
          </div>
          <div className="presc-stat">
            <Stethoscope size={16} />
            <span><strong>{[...new Set(prescriptions.map(p => p.doctor_name))].length}</strong> Doctors</span>
          </div>
          <div className="presc-stat">
            <FlaskConical size={16} />
            <span><strong>{prescriptions.reduce((a, p) => a + (p.medicines?.length || 0), 0)}</strong> Total Medicines</span>
          </div>
          <div className="presc-stat">
            <Calendar size={16} />
            <span>Last: <strong>{formatDate(prescriptions[0])}</strong></span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="presc-empty-card">
          <div className="presc-empty-icon">💊</div>
          <h3>No Prescriptions Found</h3>
          <p className="text-muted">
            {search ? `No results for "${search}"` : 'Your prescriptions will appear here after your doctor consultation.'}
          </p>
          <div className="health-quote-small">
            <Quote size={14} />
            <em>"Prevention is better than cure." — Desiderius Erasmus</em>
          </div>
        </div>
      )}

      {/* Prescription Cards */}
      <div className="presc-list">
        {filtered.map((p, i) => {
          const diagLines = p.diagnosis?.split('\n') || [];
          const mainDiag = getMainDiag(p);
          const followUpMatch = p.notes?.match(/Follow-up: (\S+)/);
          const labMatch = p.notes?.match(/Lab Tests: (.+)/);
          const cleanNotes = p.notes?.replace(/Lab Tests:.*/, '').replace(/Follow-up:.*/, '').trim();
          const isOpen = expanded[i];

          return (
            <div key={i} className={`presc-card ${isOpen ? 'presc-card-open' : ''}`}>
              {/* Card Header */}
              <div className="presc-card-header" onClick={() => toggle(i)}>
                <div className="presc-card-left">
                  <div className="rx-circle">Rx</div>
                  <div>
                    <h4 className="presc-diag">{mainDiag}</h4>
                    <div className="presc-meta">
                      <span><User size={11} /> Dr. {p.doctor_name}</span>
                      <span>·</span>
                      <span><Calendar size={11} /> {formatDate(p)}</span>
                      <span>·</span>
                      <span><Pill size={11} /> {p.medicines?.length || 0} medicines</span>
                    </div>
                  </div>
                </div>
                <div className="presc-card-right">
                  {followUpMatch && (
                    <span className="badge badge-warning">
                      <Clock size={10} /> Follow-up: {followUpMatch[1]}
                    </span>
                  )}
                  {labMatch && <span className="badge badge-info"><FlaskConical size={10} /> Lab Tests</span>}
                  <div className={`presc-chevron ${isOpen ? 'open' : ''}`}>
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>

              {/* Expanded Body */}
              {isOpen && (
                <div className="presc-card-body">
                  {/* SOAP Notes */}
                  {diagLines.length > 1 && (
                    <div className="presc-section">
                      <p className="presc-section-title">📋 Clinical Notes (SOAP Format)</p>
                      <div className="soap-box">
                        {diagLines.map((l, j) => {
                          if (!l) return null;
                          const colors = { '[S]': '#3b82f6', '[O]': '#10b981', '[A]': '#f59e0b', '[P]': '#8b5cf6' };
                          const key = Object.keys(colors).find(k => l.startsWith(k));
                          return (
                            <div key={j} className="soap-row" style={{ borderLeftColor: key ? colors[key] : '#e2e8f0' }}>
                              <span className="soap-key" style={{ color: key ? colors[key] : 'var(--text-muted)' }}>
                                {key || '  '}
                              </span>
                              <span className="soap-val">{l.replace(/^\[.\] /, '')}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Medicines Table */}
                  {p.medicines?.length > 0 && (
                    <div className="presc-section">
                      <p className="presc-section-title">💊 Prescribed Medicines</p>
                      <div className="med-cards-grid">
                        {p.medicines.map((m, j) => (
                          <div key={j} className="med-detail-card">
                            <div className="mdc-top">
                              <div className="mdc-icon">💊</div>
                              <div>
                                <p className="fw-700">{m.name}</p>
                                <p className="text-muted text-xs">Prescription Medicine</p>
                              </div>
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

                  {/* Lab Tests */}
                  {labMatch && (
                    <div className="presc-section">
                      <p className="presc-section-title"><FlaskConical size={13} /> Lab Tests Ordered</p>
                      <div className="meds-list">
                        {labMatch[1].split(', ').map((t, j) => (
                          <span key={j} className="lab-tag">🧪 {t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow-up */}
                  {followUpMatch && (
                    <div className="presc-followup">
                      <Calendar size={16} />
                      <div>
                        <p className="fw-600">Follow-up Appointment</p>
                        <p className="text-muted text-sm">Scheduled for: <strong>{followUpMatch[1]}</strong></p>
                      </div>
                    </div>
                  )}

                  {/* Doctor Notes */}
                  {cleanNotes && (
                    <div className="presc-section">
                      <p className="presc-section-title">📝 Doctor's Advice</p>
                      <div className="doctor-advice-box">
                        <Quote size={16} className="advice-quote-icon" />
                        <p>{cleanNotes}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
