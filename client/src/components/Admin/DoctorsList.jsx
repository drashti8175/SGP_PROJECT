import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { Stethoscope } from 'lucide-react';

export default function DoctorsList() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { adminService.getDoctors().then(data => { setDoctors(data); setLoading(false); }).catch(() => setLoading(false)); }, []);

  if (loading) return <div className="page-loading">Loading doctors...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Stethoscope size={22} /> Doctors</h1>
          <p className="page-sub">{doctors.length} registered doctors</p>
        </div>
      </div>

      <div className="card">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Specialty</th><th>Working Days</th></tr></thead>
          <tbody>
            {doctors.map(d => (
              <tr key={d.doctor_id}>
                <td>
                  <div className="patient-cell">
                    <div className="patient-avatar" style={{ background: '#2563eb' }}>{d.name?.charAt(0)}</div>
                    <span className="fw-600">{d.name}</span>
                  </div>
                </td>
                <td className="text-muted">{d.email}</td>
                <td><span className="badge badge-info">{d.specialty}</span></td>
                <td className="text-muted text-sm">{d.working_days?.join(', ') || 'Mon–Fri'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {doctors.length === 0 && <div className="empty-state"><Stethoscope size={40} /><p>No doctors found</p></div>}
      </div>
    </div>
  );
}
