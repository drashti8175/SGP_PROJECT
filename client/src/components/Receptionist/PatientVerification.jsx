import React, { useState, useEffect } from 'react';
import { receptionistService } from '../../services/api';
import { QrCode, Search, UserCheck, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export default function PatientVerification() {
  const [mode, setMode] = useState('qr'); // 'qr' | 'id'
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    receptionistService.getRequests().then(setAppointments).catch(() => {});
  }, []);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    setError(''); setResult(null); setCheckedIn(false); setLoading(true);
    try {
      // Search by token number or appointment ID
      const found = appointments.find(a =>
        String(a.token_number) === input.trim() ||
        a.id?.toString().includes(input.trim()) ||
        a.id?.toString().toUpperCase().endsWith(input.trim().toUpperCase())
      );
      if (found) {
        setResult(found);
      } else {
        setError('No appointment found. Please check the token number or appointment ID.');
      }
    } catch (e) {
      setError('Search failed. Please try again.');
    } finally { setLoading(false); }
  };

  // Simulate QR scan — parse JSON from QR
  const handleQRInput = (val) => {
    setInput(val);
    try {
      const parsed = JSON.parse(val);
      if (parsed.token) {
        const found = appointments.find(a => String(a.token_number) === String(parsed.token));
        if (found) { setResult(found); setError(''); }
        else setError('QR code scanned but appointment not found.');
      }
    } catch {
      // Not JSON, treat as token number
    }
  };

  const handleCheckIn = async () => {
    if (!result) return;
    await receptionistService.checkIn(result.id);
    setCheckedIn(true);
    setResult(prev => ({ ...prev, status: 'Waiting' }));
  };

  const statusColor = (s) => {
    if (s === 'confirmed') return '#10b981';
    if (s === 'Waiting') return '#f59e0b';
    if (s === 'In-Consultation') return '#2563eb';
    if (['Completed','completed'].includes(s)) return '#64748b';
    return '#dc2626';
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><QrCode size={22} /> Patient Verification</h1>
          <p className="page-sub">Verify patient identity and mark check-in</p>
        </div>
      </div>

      <div className="two-col-grid">
        {/* Left: Scanner */}
        <div className="card">
          <h3 className="card-title mb-4">Verify Patient</h3>

          {/* Mode Toggle */}
          <div className="tab-switch mb-4">
            <button className={mode === 'qr' ? 'active' : ''} onClick={() => { setMode('qr'); setInput(''); setResult(null); setError(''); }}>
              <QrCode size={14} /> Scan QR Code
            </button>
            <button className={mode === 'id' ? 'active' : ''} onClick={() => { setMode('id'); setInput(''); setResult(null); setError(''); }}>
              <Search size={14} /> Token / ID
            </button>
          </div>

          {mode === 'qr' ? (
            <div>
              <div className="qr-scan-area">
                <div className="qr-scan-frame">
                  <div className="qr-scan-corner tl" />
                  <div className="qr-scan-corner tr" />
                  <div className="qr-scan-corner bl" />
                  <div className="qr-scan-corner br" />
                  <div className="qr-scan-line" />
                  <QrCode size={64} style={{ color: 'rgba(255,255,255,0.3)' }} />
                </div>
                <p className="text-muted text-sm text-center mt-3">
                  Ask patient to show their QR code from the app
                </p>
              </div>
              <div className="field-group mt-3">
                <label>Or paste QR data / Token number</label>
                <div className="search-row">
                  <input placeholder="Paste QR data or enter token number..."
                    value={input} onChange={e => handleQRInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                  <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
                    <Search size={15} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSearch} className="form-stack">
              <div className="field-group">
                <label>Token Number or Appointment ID</label>
                <input placeholder="e.g. 5 or last 6 chars of appointment ID..."
                  value={input} onChange={e => setInput(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                <Search size={15} /> {loading ? 'Searching...' : 'Find Appointment'}
              </button>
            </form>
          )}

          {error && <div className="alert alert-danger mt-3">{error}</div>}

          {/* Today's Appointments Quick List */}
          <div className="mt-4">
            <p className="text-xs fw-700 text-muted uppercase mb-2">Today's Confirmed Appointments</p>
            <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {appointments.filter(a => a.status === 'confirmed').map(a => (
                <div key={a.id} className="quick-appt-row" onClick={() => { setResult(a); setError(''); }}>
                  <span className="token-num">#{a.token_number}</span>
                  <span className="fw-600 text-sm">{a.patient_name}</span>
                  <span className="text-muted text-xs">{a.doctor_name}</span>
                  <span className="badge badge-success" style={{ fontSize: 10 }}>Approved</span>
                </div>
              ))}
              {appointments.filter(a => a.status === 'confirmed').length === 0 && (
                <p className="text-muted text-sm">No confirmed appointments today</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Result */}
        <div>
          {result ? (
            <div className="card verification-result">
              {checkedIn ? (
                <div className="checkin-success">
                  <div className="checkin-icon">✅</div>
                  <h3 className="fw-800">Check-In Successful!</h3>
                  <p className="text-muted">{result.patient_name} has been added to the doctor's queue</p>
                  <div className="checkin-details">
                    <div className="cd-row"><span>Token</span><span className="fw-700 text-primary">#{result.token_number}</span></div>
                    <div className="cd-row"><span>Doctor</span><span className="fw-600">{result.doctor_name}</span></div>
                    <div className="cd-row"><span>Status</span><span className="badge badge-warning">⏱ Waiting</span></div>
                  </div>
                  <button className="btn btn-outline w-full mt-3" onClick={() => { setResult(null); setInput(''); setCheckedIn(false); }}>
                    Verify Next Patient
                  </button>
                </div>
              ) : (
                <>
                  <div className="vr-header">
                    <div className="vr-avatar">{result.patient_name?.charAt(0)}</div>
                    <div>
                      <h3 className="fw-800">{result.patient_name}</h3>
                      <p className="text-muted text-sm">{result.patient_email}</p>
                      {result.patient_phone && <p className="text-muted text-sm">{result.patient_phone}</p>}
                    </div>
                    <div className="vr-status" style={{ marginLeft: 'auto' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor(result.status), display: 'inline-block', marginRight: 6 }} />
                      <span className="fw-600 text-sm">{result.status}</span>
                    </div>
                  </div>

                  <div className="vr-details">
                    <div className="vr-row"><span>Token Number</span><span className="fw-800 text-primary" style={{ fontSize: 20 }}>#{result.token_number}</span></div>
                    <div className="vr-row"><span>Doctor</span><span className="fw-600">{result.doctor_name}</span></div>
                    <div className="vr-row"><span>Date</span><span className="fw-600">{result.date}</span></div>
                    <div className="vr-row"><span>Type</span><span className={`badge ${result.type === 'Emergency' ? 'badge-danger' : 'badge-info'}`}>{result.type || 'Normal'}</span></div>
                    <div className="vr-row"><span>Reason</span><span className="text-muted text-sm">{result.reason_for_visit}</span></div>
                  </div>

                  {result.status === 'confirmed' ? (
                    <button className="btn btn-success w-full mt-3" onClick={handleCheckIn}>
                      <UserCheck size={16} /> ✅ Confirm Check-In — Allow Entry
                    </button>
                  ) : result.status === 'Waiting' ? (
                    <div className="alert alert-success mt-3">
                      <CheckCircle2 size={15} /> Patient already checked in and waiting
                    </div>
                  ) : result.status === 'pending' ? (
                    <div className="alert alert-danger mt-3">
                      <AlertTriangle size={15} /> Appointment not yet approved — cannot check in
                    </div>
                  ) : (
                    <div className="alert mt-3" style={{ background: '#f1f5f9' }}>
                      <Clock size={15} /> Status: {result.status}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="card">
              <div className="empty-state">
                <QrCode size={56} style={{ opacity: 0.2 }} />
                <h3>No Patient Selected</h3>
                <p className="text-muted text-sm">Scan QR code or enter token number to verify a patient</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
