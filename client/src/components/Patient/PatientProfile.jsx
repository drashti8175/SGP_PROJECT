import React, { useState } from 'react';
import { useAuth } from '../../App';
import { User, Save, Plus, Trash2, Heart } from 'lucide-react';

export default function PatientProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    dob: '',
    gender: '',
    blood_group: '',
    address: '',
    allergies: '',
    chronic_diseases: '',
    emergency_contact: '',
  });
  const [family, setFamily] = useState([]);
  const [saved, setSaved] = useState(false);
  const [avatar, setAvatar] = useState(null);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const addFamily = () => setFamily(f => [...f, { name: '', relation: '', dob: '' }]);
  const removeFamily = (i) => setFamily(f => f.filter((_, idx) => idx !== i));
  const setFam = (i, k, v) => setFamily(f => { const n = [...f]; n[i] = { ...n[i], [k]: v }; return n; });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><User size={22} /> My Profile</h1>
          <p className="page-sub">Manage your personal and health information</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="two-col-grid">
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Avatar */}
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="avatar-upload-area">
              <div className="profile-avatar-big">
                {avatar
                  ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : <span>{user?.name?.charAt(0)}</span>}
              </div>
              <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
                📷 Upload Photo
                <input type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files[0]; if (f) setAvatar(URL.createObjectURL(f)); }} />
              </label>
              <div className="patient-id-badge">
                <span className="text-muted text-xs">Patient ID</span>
                <span className="fw-700 text-sm">{user?._id || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="card">
            <h3 className="card-title mb-4">Personal Information</h3>
            <div className="form-stack">
              <div className="field-group"><label>Full Name</label>
                <input value={form.name} onChange={e => setF('name', e.target.value)} /></div>
              <div className="field-group"><label>Email</label>
                <input type="email" value={form.email} onChange={e => setF('email', e.target.value)} /></div>
              <div className="field-group"><label>Phone</label>
                <input placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={e => setF('phone', e.target.value)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field-group"><label>Date of Birth</label>
                  <input type="date" value={form.dob} onChange={e => setF('dob', e.target.value)} /></div>
                <div className="field-group"><label>Gender</label>
                  <select value={form.gender} onChange={e => setF('gender', e.target.value)}>
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select></div>
              </div>
              <div className="field-group"><label>Address</label>
                <textarea rows={2} placeholder="Your address..." value={form.address} onChange={e => setF('address', e.target.value)} /></div>
              <div className="field-group"><label>Emergency Contact</label>
                <input placeholder="Name & Phone" value={form.emergency_contact} onChange={e => setF('emergency_contact', e.target.value)} /></div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Health Info */}
          <div className="card">
            <h3 className="card-title mb-4"><Heart size={18} /> Health Information</h3>
            <div className="form-stack">
              <div className="field-group"><label>Blood Group</label>
                <select value={form.blood_group} onChange={e => setF('blood_group', e.target.value)}>
                  <option value="">Select</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g}>{g}</option>)}
                </select></div>
              <div className="field-group"><label>Known Allergies</label>
                <textarea rows={2} placeholder="e.g. Penicillin, Dust, Pollen..." value={form.allergies} onChange={e => setF('allergies', e.target.value)} /></div>
              <div className="field-group"><label>Chronic Diseases</label>
                <textarea rows={2} placeholder="e.g. Diabetes, Hypertension..." value={form.chronic_diseases} onChange={e => setF('chronic_diseases', e.target.value)} /></div>
            </div>

            {/* Health Summary Badges */}
            {(form.blood_group || form.allergies || form.chronic_diseases) && (
              <div className="health-summary mt-3">
                {form.blood_group && <span className="badge badge-danger">🩸 {form.blood_group}</span>}
                {form.allergies && <span className="badge badge-warning">⚠ Allergies noted</span>}
                {form.chronic_diseases && <span className="badge badge-info">💊 Chronic conditions</span>}
              </div>
            )}
          </div>

          {/* Family Profiles */}
          <div className="card">
            <div className="flex-between mb-3">
              <h3 className="card-title">👨‍👩‍👧 Family Profiles</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={addFamily}><Plus size={14} /> Add</button>
            </div>
            {family.length === 0 && <p className="text-muted text-sm">No family members added yet.</p>}
            {family.map((m, i) => (
              <div key={i} className="family-row">
                <input placeholder="Name" value={m.name} onChange={e => setFam(i, 'name', e.target.value)} />
                <select value={m.relation} onChange={e => setFam(i, 'relation', e.target.value)}>
                  <option value="">Relation</option>
                  {['Parent','Spouse','Child','Sibling','Other'].map(r => <option key={r}>{r}</option>)}
                </select>
                <input type="date" value={m.dob} onChange={e => setFam(i, 'dob', e.target.value)} />
                <button type="button" className="btn btn-xs btn-danger" onClick={() => removeFamily(i)}><Trash2 size={12} /></button>
              </div>
            ))}
          </div>

          {saved && <div className="alert alert-success">✅ Profile saved successfully!</div>}
          <button type="submit" className="btn btn-primary w-full"><Save size={16} /> Save Profile</button>
        </div>
      </form>
    </div>
  );
}
