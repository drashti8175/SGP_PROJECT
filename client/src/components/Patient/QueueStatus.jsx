import React, { useState, useEffect, useCallback } from 'react';
import { patientService, socket } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, RefreshCw, Users, Bell, CheckCircle2 } from 'lucide-react';

function smartArrival(waitMins) {
  if (!waitMins || waitMins <= 0) return null;
  const arrive = new Date(Date.now() + waitMins * 60000);
  const buffer = new Date(arrive.getTime() + 10 * 60000);
  const fmt = d => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${fmt(arrive)} – ${fmt(buffer)}`;
}

export default function QueueStatus() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [queueInfo, setQueueInfo] = useState(null);
  const [fullQueue, setFullQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    patientService.getDoctors().then(setDoctors).catch(console.error);
  }, []);

  const fetchQueue = useCallback(async (docId) => {
    if (!docId) return;
    setLoading(true);
    try {
      const [info, full] = await Promise.all([
        patientService.getQueue(docId),
        patientService.getFullQueue(docId),
      ]);
      setQueueInfo(info);
      setFullQueue(full);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    socket.emit('join_queue');
    socket.on('queue_updated', () => fetchQueue(selectedDoctor));
    return () => socket.off('queue_updated');
  }, [selectedDoctor, fetchQueue]);

  const handleSelect = (e) => {
    setSelectedDoctor(e.target.value);
    fetchQueue(e.target.value);
  };

  const arrival = smartArrival(queueInfo?.estimated_wait_time_mins);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Clock size={22} /> Queue Status</h1>
          <p className="page-sub">
            Real-time queue tracking
            {lastUpdated && <span className="text-muted text-xs"> · Last updated: {lastUpdated}</span>}
          </p>
        </div>
        {selectedDoctor && (
          <button className="btn btn-outline" onClick={() => fetchQueue(selectedDoctor)} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
          </button>
        )}
      </div>

      {/* Doctor Selector */}
      <div className="card max-w-lg">
        <div className="field-group">
          <label>Select Doctor to Track</label>
          <select value={selectedDoctor} onChange={handleSelect}>
            <option value="">-- Select a Doctor --</option>
            {doctors.map(d => (
              <option key={d.doctor_id || d._id} value={d.doctor_id || d._id}>
                {d.name} — {d.specialization}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="page-loading"><div className="spinner" /></div>}

      <AnimatePresence>
        {queueInfo && !loading && (
          <motion.div key="queue-data" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

            {/* Your Turn Alert */}
            {queueInfo.is_my_turn && (
              <div className="your-turn-card" style={{ borderRadius: 14, padding: '20px 24px', marginBottom: 0 }}>
                <div className="your-turn-content">
                  <span className="your-turn-icon">🔔</span>
                  <div>
                    <h3>It's Your Turn!</h3>
                    <p>Please proceed to the consultation room immediately.</p>
                  </div>
                  <CheckCircle2 size={32} style={{ marginLeft: 'auto', color: 'white' }} />
                </div>
              </div>
            )}

            {/* Smart Arrival */}
            {arrival && !queueInfo.is_my_turn && (
              <div className="smart-arrival-banner">
                🕐 <strong>Smart Arrival Suggestion:</strong> Arrive between <strong>{arrival}</strong> to avoid waiting at the clinic.
              </div>
            )}

            {/* Queue Stats */}
            <div className="queue-status-grid">
              <div className="card queue-stat-card">
                <p className="stat-label">Your Token</p>
                <h1 className="token-big text-primary">
                  {queueInfo.token_number ? `#${queueInfo.token_number}` : 'N/A'}
                </h1>
              </div>
              <div className="card queue-stat-card">
                <p className="stat-label">Now Serving</p>
                <h1 className="token-big text-success">
                  {queueInfo.current_serving_token !== 'None' ? `#${queueInfo.current_serving_token}` : '—'}
                </h1>
              </div>
              <div className="card queue-stat-card">
                <p className="stat-label">Patients Ahead</p>
                <h1 className="token-big text-warning">{queueInfo.patients_ahead ?? '—'}</h1>
              </div>
              <div className="card queue-stat-card">
                <p className="stat-label">Est. Wait Time</p>
                <h1 className="token-big text-primary">
                  {queueInfo.estimated_wait_time_mins != null ? `${queueInfo.estimated_wait_time_mins}m` : '—'}
                </h1>
              </div>
            </div>

            {/* Full Queue */}
            {fullQueue.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title"><Users size={18} /> Full Queue ({fullQueue.length} patients)</h3>
                  <span className="badge badge-success">● Live</span>
                </div>
                <table className="data-table">
                  <thead>
                    <tr><th>#</th><th>Token</th><th>Patient</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {fullQueue.map((p, i) => (
                      <tr key={i} className={p.token_number === queueInfo.token_number ? 'row-active' : ''}>
                        <td className="fw-600">{i + 1}</td>
                        <td>
                          <span className="token-num">#{p.token_number}</span>
                          {p.token_number === queueInfo.token_number && (
                            <span className="badge badge-primary" style={{ marginLeft: 6, fontSize: 10 }}>You</span>
                          )}
                        </td>
                        <td>{p.patient_name}</td>
                        <td>
                          <span className={`badge ${p.status === 'In-Consultation' ? 'badge-success' : 'badge-warning'}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedDoctor && (
        <div className="card max-w-lg">
          <div className="empty-state">
            <Clock size={48} />
            <p>Select a doctor above to see live queue status</p>
          </div>
        </div>
      )}
    </div>
  );
}
