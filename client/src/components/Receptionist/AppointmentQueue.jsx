import React, { useState, useEffect } from 'react';
import { receptionistService } from '../../services/api';
import { socket } from '../../services/api';
import { LayoutDashboard, RefreshCw, CheckCircle, XCircle, UserCheck, CreditCard } from 'lucide-react';

const statusBadge = (s) => {
  if (s === 'confirmed' || s === 'Waiting') return 'badge-success';
  if (s === 'In-Consultation') return 'badge-info';
  if (['Completed', 'completed'].includes(s)) return 'badge-warning';
  if (['Cancelled', 'cancelled'].includes(s)) return 'badge-danger';
  return 'badge-warning';
};

export default function AppointmentQueue() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchData = () => {
    receptionistService.getRequests().then(data => { setAppointments(data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    socket.emit('join_queue');
    socket.on('queue_updated', fetchData);
    socket.on('appointment_updated', fetchData);
    return () => { socket.off('queue_updated', fetchData); socket.off('appointment_updated', fetchData); };
  }, []);

  const updateStatus = async (id, status) => { await receptionistService.updateStatus(id, status); fetchData(); };
  const checkIn = async (id) => { await receptionistService.checkIn(id); fetchData(); };
  const markPaid = async (id) => { await receptionistService.updatePayment(id, 'paid'); fetchData(); };

  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status.toLowerCase() === filter);

  if (loading) return <div className="page-loading">Loading appointments...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><LayoutDashboard size={22} /> Appointment Queue</h1>
          <p className="page-sub">{appointments.length} total appointments</p>
        </div>
        <button className="btn btn-outline" onClick={fetchData}><RefreshCw size={16} /> Refresh</button>
      </div>

      <div className="filter-tabs mb-4">
        {['all', 'waiting', 'confirmed', 'completed', 'cancelled'].map(f => (
          <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state"><LayoutDashboard size={48} /><p>No appointments found</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Token</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Status</th><th>Payment</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td><span className="token-num">#{a.token_number}</span></td>
                  <td>
                    <p className="fw-600">{a.patient_name}</p>
                    <p className="text-muted text-xs">{a.patient_email}</p>
                  </td>
                  <td>{a.doctor_name}</td>
                  <td>{a.date}</td>
                  <td><span className={`badge ${statusBadge(a.status)}`}>{a.status}</span></td>
                  <td><span className={`badge ${a.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{a.payment_status || 'pending'}</span></td>
                  <td>
                    <div className="action-btns">
                      {!['Waiting', 'In-Consultation', 'Completed', 'completed'].includes(a.status) && (
                        <button className="btn btn-xs btn-success" title="Confirm" onClick={() => updateStatus(a.id, 'confirmed')}><CheckCircle size={13} /></button>
                      )}
                      {a.status === 'confirmed' && (
                        <button className="btn btn-xs btn-primary" title="Check In" onClick={() => checkIn(a.id)}><UserCheck size={13} /></button>
                      )}
                      {a.payment_status !== 'paid' && (
                        <button className="btn btn-xs btn-warning" title="Mark Paid" onClick={() => markPaid(a.id)}><CreditCard size={13} /></button>
                      )}
                      {!['Completed', 'completed', 'Cancelled', 'cancelled'].includes(a.status) && (
                        <button className="btn btn-xs btn-danger" title="Cancel" onClick={() => updateStatus(a.id, 'cancelled')}><XCircle size={13} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
