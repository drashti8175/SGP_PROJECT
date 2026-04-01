import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { Stethoscope, Plus, Edit2, Trash2, X, Save, Users, Star } from 'lucide-react';

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'add' | {doctor}
  const [form, setForm] = useState({ name: '', email: '', password: '1234', specialization: '', consultationFee: '', experience: '' });
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    adminService.getDoctors().then(setDoctors).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => {
    setForm({ name: '', email: '', password: '1234', specialization: '', consultationFee: '', experience: '' });
    setModal('add');
  };

  const openEdit = (d) => {
    setForm({ name: d.name, email: d.email, password: '', specialization: d.specialization, consultationFee: d.consultationFee, experience: d.experience, doctor_id: d.doctor_id });
    setModal('edit');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'add') {
        await adminService.addDoctor(form);
        notify('✅ Doctor added successfully');
      } else {
        await adminService.updateDoctor({ doctor_id: form.doctor_id, specialization: form.specialization, consultationFee: form.consultationFee, experience: form.experience });
        notify('✅ Doctor updated');
      }
      setModal(null);
      fetchData();
    } catch (e) {
      notify('❌ ' + (e.response?.data?.error || 'Failed'));
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove Dr. ${name}?`)) return;
    await adminService.deleteDoctor(id);
    notify(`✅ ${name} removed`);
    fetchData();
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Stethoscope size={22} /> Doctor Management</h1>
          <p className="page-sub">{doctors.length} registered doctors</p>
        </div>
        <div className="header-actions">
          {toast && <span className="action-toast">{toast}</span>}
          <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Doctor</button>
        </div>
      </div>

      <div className="doctor-mgmt-grid">
        {doctors.map(d => (
          <div key={d.doctor_id} className="doctor-mgmt-card">
            <div className="dmc-header">
              <div className="dmc-avatar">{d.name?.charAt(3) || d.name?.charAt(0)}</div>
              <div className="dmc-actions">
                <button className="btn btn-xs btn-outline" onClick={() => openEdit(d)}><Edit2 size={12} /></button>
                <button className="btn btn-xs btn-danger" onClick={() => handleDelete(d.doctor_id, d.name)}><Trash2 size={12} /></button>
              </div>
            </div>
            <h4 className="fw-700 mt-2">{d.name}</h4>
            <p className="text-muted text-sm">{d.specialization}</p>
            <p className="text-muted text-xs">{d.email}</p>
            <div className="dmc-stats">
              <div className="dmc-stat"><Users size={13} /><span>{d.today_patients} today</span></div>
              <div className="dmc-stat"><Star size={13} /><span>{d.total_patients} total</span></div>
              <div className="dmc-stat">₹{d.consultationFee}</div>
            </div>
            <div className="dmc-exp">
              <span className="badge badge-info">{d.experience || 0} yrs exp</span>
              {d.rating > 0 && <span className="badge badge-warning">⭐ {d.rating}</span>}
            </div>
          </div>
        ))}
        {doctors.length === 0 && (
          <div className="card" style={{ gridColumn: '1/-1' }}>
            <div className="empty-state"><Stethoscope size={48} /><p>No doctors yet</p>
              <button className="btn btn-primary btn-sm" onClick={openAdd}>Add First Doctor</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="fw-700">{modal === 'add' ? 'Add New Doctor' : 'Edit Doctor'}</h3>
              <button className="btn btn-xs btn-outline" onClick={() => setModal(null)}><X size={14} /></button>
            </div>
            <form onSubmit={handleSave} className="form-stack mt-3">
              {modal === 'add' && <>
                <div className="field-group"><label>Full Name *</label>
                  <input value={form.name} onChange={e => setF('name', e.target.value)} required /></div>
                <div className="field-group"><label>Email *</label>
                  <input type="email" value={form.email} onChange={e => setF('email', e.target.value)} required /></div>
                <div className="field-group"><label>Password</label>
                  <input value={form.password} onChange={e => setF('password', e.target.value)} /></div>
              </>}
              <div className="field-group"><label>Specialization *</label>
                <input placeholder="e.g. Cardiologist" value={form.specialization} onChange={e => setF('specialization', e.target.value)} required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field-group"><label>Consultation Fee (₹)</label>
                  <input type="number" value={form.consultationFee} onChange={e => setF('consultationFee', e.target.value)} /></div>
                <div className="field-group"><label>Experience (years)</label>
                  <input type="number" value={form.experience} onChange={e => setF('experience', e.target.value)} /></div>
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={saving}>
                <Save size={15} /> {saving ? 'Saving...' : modal === 'add' ? 'Add Doctor' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
