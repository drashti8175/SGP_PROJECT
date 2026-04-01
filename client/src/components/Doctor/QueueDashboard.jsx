import React, { useState, useEffect, useCallback } from 'react';
import { doctorService, socket } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Clock, AlertCircle, TrendingUp, Stethoscope,
  CheckCircle2, PhoneCall, Activity, User, FileText,
  Heart, Thermometer, Weight, SkipForward, Quote
} from 'lucide-react';

const QUOTES = [
  "Wherever the art of medicine is loved, there is also a love of humanity. — Hippocrates",
  "The good physician treats the disease; the great physician treats the patient. — William Osler",
  "Medicine is not only a science; it is also an art. — Paracelsus",
];

export default function QueueDashboard() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({ total_appointments: 0, patients_waiting: 0, emergency_count: 0, avg_consult_time: '10m' });
  const [activePatient, setActivePatient] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [ecgOffset, setEcgOffset] = useState(0);

  // Live ECG animation
  useEffect(() => {
    const t = setInterval(() => setEcgOffset(o => (o + 4) % 300), 50);
    return () => clearInterval(t);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [q, s] = await Promise.all([doctorService.getQueue(), doctorService.getStats()]);
      setQueue(q);
      setStats(s);
      const active = q.find(p => p.status === 'In-Consultation') || null;
      setActivePatient(active);
      if (active && !selectedPatient) setSelectedPatient(active);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    socket.emit('join_queue');
    socket.on('queue_updated', fetchData);
    return () => socket.off('queue_updated', fetchData);
  }, [fetchData]);

  const callNext = async (id) => { await doctorService.callPatient(id); fetchData(); };
  const complete = async (id) => { await doctorService.completeConsultation(id); fetchData(); };

  const waiting = queue.filter(p => p.status === 'Waiting');
  const smartWait = (pos) => pos === 0 ? 'Next up' : `~${pos * 10} min`;

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title"><Activity size={22} /> Live Queue Dashboard</h1>
          <p className="page-sub">Real-time patient queue monitoring</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => navigate('/doctor/prescribe')}>
            <FileText size={15} /> Write Prescription
          </button>
          {waiting.length > 0 && (
            <button className="btn btn-success" onClick={() => callNext(waiting[0].id)}>
              <PhoneCall size={15} /> Call Next Patient
            </button>
          )}
        </div>
      </div>

      {/* Quote */}
      <div className="doctor-quote-bar">
        <Quote size={14} />
        <em className="text-sm">{quote}</em>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon={<Users size={20} />} label="Total Today" value={stats.total_appointments} />
        <StatCard icon={<Clock size={20} />} label="Waiting" value={stats.patients_waiting} color="warning" />
        <StatCard icon={<AlertCircle size={20} />} label="Emergency" value={stats.emergency_count} color="danger" />
        <StatCard icon={<TrendingUp size={20} />} label="Avg. Time" value={stats.avg_consult_time} color="success" />
      </div>

      <div className="queue-doctor-layout">
        {/* LEFT: Queue List */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Users size={18} /> Patient Queue ({queue.length})</h3>
            <span className="badge badge-success">● Live</span>
          </div>

          {queue.length === 0 ? (
            <div className="empty-state">
              <Users size={48} />
              <h3>Queue is Empty</h3>
              <p className="text-muted text-sm">No patients waiting right now</p>
            </div>
          ) : (
            <div className="queue-patient-list">
              <AnimatePresence>
                {queue.map((p, i) => (
                  <motion.div key={p.id}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    className={`queue-patient-row ${p.status === 'In-Consultation' ? 'qpr-active' : ''} ${p.type === 'Emergency' ? 'qpr-emergency' : ''} ${selectedPatient?.id === p.id ? 'qpr-selected' : ''}`}
                    onClick={() => setSelectedPatient(p)}>
                    <div className="qpr-pos">{i + 1}</div>
                    <div className="qpr-avatar">{p.patient_name?.charAt(0)}</div>
                    <div className="qpr-info">
                      <p className="fw-700">{p.patient_name}</p>
                      <p className="text-muted text-xs">{p.reason || 'General Checkup'} · {smartWait(i)}</p>
                    </div>
                    <div className="qpr-badges">
                      <span className="token-num">#{p.token_number}</span>
                      {p.type === 'Emergency' && <span className="badge badge-danger">🚨</span>}
                      <span className={`badge ${p.status === 'In-Consultation' ? 'badge-success' : 'badge-warning'}`}>
                        {p.status === 'In-Consultation' ? 'Active' : 'Waiting'}
                      </span>
                    </div>
                    <div className="qpr-actions">
                      {p.status === 'In-Consultation' ? (
                        <button className="btn btn-xs btn-success" onClick={e => { e.stopPropagation(); complete(p.id); }}>
                          <CheckCircle2 size={12} /> Done
                        </button>
                      ) : (
                        <button className="btn btn-xs btn-primary" onClick={e => { e.stopPropagation(); callNext(p.id); }}>
                          <PhoneCall size={12} /> Call
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* RIGHT: Patient Detail Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {selectedPatient ? (
            <>
              {/* Patient Info Card */}
              <div className="card patient-detail-panel">
                <div className="pdp-header">
                  <div className="pdp-avatar">{selectedPatient.patient_name?.charAt(0)}</div>
                  <div>
                    <h3 className="fw-800">{selectedPatient.patient_name}</h3>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                      <span className="token-num">Token #{selectedPatient.token_number}</span>
                      <span className={`badge ${selectedPatient.type === 'Emergency' ? 'badge-danger' : 'badge-info'}`}>
                        {selectedPatient.type}
                      </span>
                      <span className={`badge ${selectedPatient.status === 'In-Consultation' ? 'badge-success' : 'badge-warning'}`}>
                        {selectedPatient.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pdp-details">
                  {selectedPatient.gender && <DetailChip label="Gender" value={selectedPatient.gender} />}
                  {selectedPatient.age && selectedPatient.age !== 'N/A' && <DetailChip label="Age" value={`${selectedPatient.age} yrs`} />}
                  {selectedPatient.risk_level && <DetailChip label="Risk" value={selectedPatient.risk_level} />}
                </div>

                <div className="pdp-complaint">
                  <p className="text-xs fw-700 text-muted uppercase mb-1">Chief Complaint</p>
                  <p className="fw-600">{selectedPatient.reason || 'General Checkup'}</p>
                </div>

                {/* Vitals */}
                <div className="pdp-vitals">
                  <p className="text-xs fw-700 text-muted uppercase mb-2">Vitals</p>
                  <div className="vitals-grid">
                    <VitalCard icon="🩸" label="BP" value={selectedPatient.vitals?.bp || '120/80'} unit="mmHg" />
                    <VitalCard icon="🌡️" label="Temp" value={selectedPatient.vitals?.temp || '98.6'} unit="°F" />
                    <VitalCard icon="⚖️" label="Weight" value={selectedPatient.vitals?.weight || '70'} unit="kg" />
                    <VitalCard icon="💓" label="Pulse" value="72" unit="bpm" />
                  </div>
                </div>

                {/* Live ECG if in consultation */}
                {selectedPatient.status === 'In-Consultation' && (
                  <div className="vitals-monitor mt-3">
                    <div className="monitor-header">
                      <span>Live ECG Monitor</span>
                      <span className="live-dot">● LIVE</span>
                    </div>
                    <div className="ecg-line">
                      <svg width="100%" height="50" viewBox="0 0 300 50" style={{ overflow: 'hidden' }}>
                        <path
                          d={`M${-ecgOffset} 25 L${30-ecgOffset} 25 L${40-ecgOffset} 10 L${50-ecgOffset} 40 L${60-ecgOffset} 25 L${90-ecgOffset} 25 L${110-ecgOffset} 25 L${120-ecgOffset} 8 L${130-ecgOffset} 42 L${140-ecgOffset} 25 L${180-ecgOffset} 25 L${480-ecgOffset} 25`}
                          fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pdp-actions">
                  {selectedPatient.status === 'In-Consultation' ? (
                    <>
                      <button className="btn btn-primary w-full" onClick={() => navigate('/doctor/prescribe')}>
                        <FileText size={15} /> Write Prescription
                      </button>
                      <button className="btn btn-success w-full" onClick={() => complete(selectedPatient.id)}>
                        <CheckCircle2 size={15} /> Complete Consultation
                      </button>
                    </>
                  ) : (
                    <button className="btn btn-primary w-full" onClick={() => callNext(selectedPatient.id)}>
                      <PhoneCall size={15} /> Call This Patient
                    </button>
                  )}
                  {selectedPatient.patient_id && (
                    <button className="btn btn-outline w-full" onClick={() => navigate('/doctor/history')}>
                      <User size={15} /> View Patient History
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="card">
              <div className="empty-state">
                <Stethoscope size={48} />
                <h3>Select a Patient</h3>
                <p className="text-muted text-sm">Click any patient from the queue to see their details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ icon, label, value, color }) => (
  <div className={`stat-card ${color ? `stat-${color}` : ''}`}>
    <div className="stat-icon">{icon}</div>
    <div><p className="stat-label">{label}</p><h2 className="stat-value">{value}</h2></div>
  </div>
);

const VitalCard = ({ icon, label, value, unit }) => (
  <div className="vital-card">
    <span className="vital-card-icon">{icon}</span>
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="fw-700">{value} <span className="text-xs text-muted">{unit}</span></p>
    </div>
  </div>
);

const DetailChip = ({ label, value }) => (
  <div className="detail-chip">
    <span className="text-muted text-xs">{label}:</span>
    <span className="fw-600 text-sm">{value}</span>
  </div>
);
