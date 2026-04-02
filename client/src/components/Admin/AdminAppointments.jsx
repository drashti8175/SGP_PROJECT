import React, { useState, useEffect, useCallback } from 'react';
import { adminService, socket } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CheckCircle2, XCircle, RefreshCw, AlertCircle, Users } from 'lucide-react';

const statusBadge = s => {
  if (s === 'confirmed') return 'badge-info';
  if (s === 'Waiting') return 'badge-warning';
  if (s === 'In-Consultation') return 'badge-success';
  if (['Completed','completed'].includes(s)) return 'badge-info';
  if (['Cancelled','cancelled'].includes(s)) return 'badge-danger';
  return 'badge-warning';
};

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState([]);
  const [toast, setToast] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const data = await adminService.getAppointments({ status: filter === 'all' ? undefined : filter });
      setAppointments(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    socket.on('appointment_updated', fetchData);
    return () => socket.off('appointment_updated', fetchData);
  }, [fetchData]);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const batchApprove = async () => {
    if (!selected.length) return;
    await adminService.batchApprove(selected);
    notify(`✅ ${selected.length} appointments approved`);
    setSelected([]);
    fetchData();
  };

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(s => s.length === appointments.length ? [] : appointments.map(a => a.id));

  const pending = appointments.filter(a => a.status === 'confirmed');

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Calendar size={22} /> Appointment Management</h1>
          <p className="page-sub">{appointments.length} appointments · {pending.length} pending</p>
        </div>
        <div className="header-actions">
          {toast && <span className="action-toast">{toast}</span>}
          <button className="btn btn-outline" onClick={fetchData}><RefreshCw size={15} /></button>
          {selected.length > 0 && (
            <button className="btn btn-success" onClick={batchApprove}>
              <CheckCircle2 size={15} /> Approve {selected.length} Selected
            </button>
          )}
        </div>
      </div>

      {pending.length > 0 && (
        <div className="cdss-banner">
          <AlertCircle size={15} />
          <strong>{pending.length} appointments awaiting approval</strong>
          <button className="btn btn-sm btn-success" onClick={() => {
            setSelected(pending.map(a => a.id));
          }}>Select All Pending</button>
        </div>
      )}

      <div className="filter-tabs">
        {['all','confirmed','Waiting','In-Consultation','Completed','Cancelled'].map(f => (
          <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? `All (${appointments.length})` : f}
          </button>
        ))}
      </div>

      <div className="card">
        {appointments.length === 0 ? (
          <div className="empty-state"><Calendar size={48} /><p>No appointments found</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th><input type="checkbox" onChange={toggleAll} checked={selected.length === appointments.length} /></th>
                  <th>Token</th><th>Patient</th><th>Doctor</th><th>Date</th>
                  <th>Type</th><th>Status</th><th>Payment</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {appointments.map(a => (
                    <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className={`${a.type === 'Emergency' ? 'row-emergency' : ''} ${selected.includes(a.id) ? 'row-selected' : ''}`}>
                      <td><input type="checkbox" checked={selected.includes(a.id)} onChange={() => toggleSelect(a.id)} /></td>
                      <td><span className="token-num">#{a.token_number}</span></td>
                      <td>
                        <div className="patient-cell">
                          <div className="patient-avatar">{a.patient_name?.charAt(0)}</div>
                          <div>
                            <p className="fw-600">{a.patient_name}</p>
                            <p className="text-muted text-xs">{a.patient_email}</p>
                            {a.patient_phone && <p className="text-muted text-xs">{a.patient_phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td>{a.doctor_name}</td>
                      <td className="text-muted">{a.date}</td>
                      <td><span className={`badge ${a.type === 'Emergency' ? 'badge-danger' : 'badge-info'}`}>{a.type || 'Normal'}</span></td>
                      <td><span className={`badge ${statusBadge(a.status)}`}>{a.status}</span></td>
                      <td><span className={`badge ${a.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{a.payment_status || 'pending'}</span></td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
