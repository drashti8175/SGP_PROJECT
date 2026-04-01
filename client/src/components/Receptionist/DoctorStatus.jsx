import React, { useState, useEffect } from 'react';
import { receptionistService } from '../../services/api';
import { Stethoscope, RefreshCw, Clock, Users } from 'lucide-react';

export default function DoctorStatus() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    receptionistService.getDoctors()
      .then(setDoctors)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Stethoscope size={22} /> Doctor Availability</h1>
          <p className="page-sub">Real-time doctor queue status for today</p>
        </div>
        <button className="btn btn-outline" onClick={fetchData}><RefreshCw size={15} /> Refresh</button>
      </div>

      <div className="doctor-status-grid">
        {doctors.map(d => (
          <div key={d._id} className={`doctor-status-card ${d.status === 'Available' ? 'dsc-available' : 'dsc-busy'}`}>
            <div className="dsc-top">
              <div className="dsc-avatar">{d.name?.charAt(3) || d.name?.charAt(0)}</div>
              <span className={`badge ${d.status === 'Available' ? 'badge-success' : 'badge-danger'}`}>
                ● {d.status}
              </span>
            </div>
            <h4 className="fw-700 mt-2">{d.name}</h4>
            <p className="text-muted text-sm">{d.specialization}</p>
            <p className="text-muted text-xs">{d.email}</p>
            <div className="dsc-stats">
              <div className="dsc-stat">
                <Users size={14} />
                <span>{d.queue_count} in queue</span>
              </div>
              <div className="dsc-stat">
                <Clock size={14} />
                <span>~{d.queue_count * 10} min wait</span>
              </div>
            </div>
            <div className="dsc-fee">Consultation: ₹{d.consultationFee}</div>
          </div>
        ))}
        {doctors.length === 0 && (
          <div className="card"><div className="empty-state"><Stethoscope size={48} /><p>No doctors found</p></div></div>
        )}
      </div>
    </div>
  );
}
