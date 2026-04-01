import React, { useState } from 'react';
import { Settings, Save, Clock, Users, Shield, Bell } from 'lucide-react';

export default function ClinicSettings() {
  const [settings, setSettings] = useState({
    clinicName: 'MediCore Clinic',
    address: '123 Health Street, Mumbai - 400001',
    phone: '+91 98765 43210',
    email: 'info@medicore.clinic',
    openTime: '09:00',
    closeTime: '18:00',
    workingDays: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    avgConsultTime: '10',
    maxTokensPerHour: '6',
    emergencyProtocol: true,
    autoApprove: false,
    notifyPatients: true,
    qrEnabled: true,
  });
  const [saved, setSaved] = useState(false);
  const setF = (k, v) => setSettings(s => ({ ...s, [k]: v }));

  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

  const toggleDay = (day) => {
    setSettings(s => ({
      ...s,
      workingDays: s.workingDays.includes(day)
        ? s.workingDays.filter(d => d !== day)
        : [...s.workingDays, day]
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Settings size={22} /> Clinic Settings</h1>
          <p className="page-sub">Configure clinic operations and system preferences</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="two-col-grid">
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 className="card-title mb-4">🏥 Clinic Information</h3>
            <div className="form-stack">
              <div className="field-group"><label>Clinic Name</label>
                <input value={settings.clinicName} onChange={e => setF('clinicName', e.target.value)} /></div>
              <div className="field-group"><label>Address</label>
                <textarea rows={2} value={settings.address} onChange={e => setF('address', e.target.value)} /></div>
              <div className="field-group"><label>Phone</label>
                <input value={settings.phone} onChange={e => setF('phone', e.target.value)} /></div>
              <div className="field-group"><label>Email</label>
                <input type="email" value={settings.email} onChange={e => setF('email', e.target.value)} /></div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title mb-4"><Clock size={18} /> Working Hours</h3>
            <div className="form-stack">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field-group"><label>Opening Time</label>
                  <input type="time" value={settings.openTime} onChange={e => setF('openTime', e.target.value)} /></div>
                <div className="field-group"><label>Closing Time</label>
                  <input type="time" value={settings.closeTime} onChange={e => setF('closeTime', e.target.value)} /></div>
              </div>
              <div className="field-group">
                <label>Working Days</label>
                <div className="days-selector">
                  {days.map(d => (
                    <button key={d} type="button"
                      className={`day-btn ${settings.workingDays.includes(d) ? 'day-active' : ''}`}
                      onClick={() => toggleDay(d)}>
                      {d.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 className="card-title mb-4"><Users size={18} /> Queue Configuration</h3>
            <div className="form-stack">
              <div className="field-group">
                <label>Avg. Consultation Time (minutes)</label>
                <input type="number" min="5" max="60" value={settings.avgConsultTime} onChange={e => setF('avgConsultTime', e.target.value)} />
                <p className="text-muted text-xs">Used for smart wait time calculation</p>
              </div>
              <div className="field-group">
                <label>Max Tokens Per Hour</label>
                <input type="number" min="1" max="20" value={settings.maxTokensPerHour} onChange={e => setF('maxTokensPerHour', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title mb-4"><Shield size={18} /> System Preferences</h3>
            <div className="form-stack">
              {[
                { key: 'emergencyProtocol', label: 'Emergency Priority Protocol', desc: 'Emergency patients get top queue priority' },
                { key: 'autoApprove', label: 'Auto-Approve Appointments', desc: 'Automatically confirm new bookings' },
                { key: 'notifyPatients', label: 'Patient Notifications', desc: 'Send queue updates to patients' },
                { key: 'qrEnabled', label: 'QR Code Check-In', desc: 'Enable QR scanning at reception' },
              ].map(item => (
                <div key={item.key} className="toggle-row">
                  <div>
                    <p className="fw-600 text-sm">{item.label}</p>
                    <p className="text-muted text-xs">{item.desc}</p>
                  </div>
                  <div className={`toggle-switch ${settings[item.key] ? 'toggle-on' : ''}`}
                    onClick={() => setF(item.key, !settings[item.key])}>
                    <div className="toggle-thumb" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {saved && <div className="alert alert-success">✅ Settings saved successfully!</div>}
          <button type="submit" className="btn btn-primary w-full"><Save size={15} /> Save Settings</button>
        </div>
      </form>
    </div>
  );
}
