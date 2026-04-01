import React, { useState } from 'react';
import { useAuth } from '../../App';
import { User, Save, Clock, Camera } from 'lucide-react';

export default function DoctorProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    specialization: '',
    experience: '',
    consultationStart: '09:00',
    consultationEnd: '17:00',
    avgConsultDuration: '10',
    bio: '',
  });
  const [avatar, setAvatar] = useState(null);
  const [saved, setSaved] = useState(false);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    if (file) setAvatar(URL.createObjectURL(file));
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><User size={22} /> Doctor Profile</h1>
          <p className="page-sub">Manage your information and availability</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="two-col-grid">
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 className="card-title mb-4">Profile Picture</h3>
            <div className="avatar-upload-area">
              <div className="profile-avatar-big">
                {avatar ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : <span>{user?.name?.charAt(0)}</span>}
              </div>
              <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
                <Camera size={15} /> Upload Photo
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatar} />
              </label>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title mb-4">Personal Information</h3>
            <div className="form-stack">
              <div className="field-group">
                <label>Full Name</label>
                <input value={form.name} onChange={e => setF('name', e.target.value)} />
              </div>
              <div className="field-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setF('email', e.target.value)} />
              </div>
              <div className="field-group">
                <label>Phone</label>
                <input placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={e => setF('phone', e.target.value)} />
              </div>
              <div className="field-group">
                <label>Bio / About</label>
                <textarea rows={3} placeholder="Brief professional bio..." value={form.bio} onChange={e => setF('bio', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 className="card-title mb-4">Professional Details</h3>
            <div className="form-stack">
              <div className="field-group">
                <label>Specialization</label>
                <input placeholder="e.g. Cardiologist" value={form.specialization} onChange={e => setF('specialization', e.target.value)} />
              </div>
              <div className="field-group">
                <label>Years of Experience</label>
                <input type="number" min="0" placeholder="e.g. 10" value={form.experience} onChange={e => setF('experience', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title mb-4"><Clock size={18} /> Consultation Schedule</h3>
            <div className="form-stack">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field-group">
                  <label>Start Time</label>
                  <input type="time" value={form.consultationStart} onChange={e => setF('consultationStart', e.target.value)} />
                </div>
                <div className="field-group">
                  <label>End Time</label>
                  <input type="time" value={form.consultationEnd} onChange={e => setF('consultationEnd', e.target.value)} />
                </div>
              </div>
              <div className="field-group">
                <label>Avg. Consultation Duration (minutes)</label>
                <input type="number" min="5" max="60" value={form.avgConsultDuration} onChange={e => setF('avgConsultDuration', e.target.value)} />
              </div>
              <div className="consult-preview">
                <Clock size={14} />
                <span>Seeing patients from <strong>{form.consultationStart}</strong> to <strong>{form.consultationEnd}</strong>, ~<strong>{form.avgConsultDuration} min</strong> per patient</span>
              </div>
            </div>
          </div>

          {saved && <div className="alert alert-success">✅ Profile saved successfully!</div>}
          <button type="submit" className="btn btn-primary w-full">
            <Save size={16} /> Save Profile
          </button>
        </div>
      </form>
    </div>
  );
}
