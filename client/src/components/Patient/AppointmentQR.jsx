import React, { useState, useEffect, useRef } from 'react';
import { patientService } from '../../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Download, CheckCircle2, Calendar, User, Hash } from 'lucide-react';

export default function AppointmentQR() {
  const [appointments, setAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const qrRef = useRef(null);

  useEffect(() => {
    patientService.getAppointments()
      .then(data => {
        setAllAppointments(data);
        const active = data.filter(a =>
          ['Waiting', 'confirmed', 'In-Consultation'].includes(a.status)
        );
        setAppointments(active);
        if (active.length > 0) setSelected(active[0]);
        else if (data.length > 0) setSelected(data[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // QR value — JSON string with appointment info
  const qrValue = selected ? JSON.stringify({
    appointment_id: selected.id,
    token: selected.token_number,
    patient: selected.patient_name || 'Patient',
    doctor: selected.doctor_name,
    date: selected.date,
    status: selected.status,
  }) : '';

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 300, 300);
      ctx.drawImage(img, 0, 0, 300, 300);
      const link = document.createElement('a');
      link.download = `medicore-qr-token-${selected?.token_number || 'appointment'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><QrCode size={22} /> Appointment QR Code</h1>
          <p className="page-sub">Show this QR at reception for instant check-in</p>
        </div>
      </div>

      {allAppointments.length === 0 ? (
        <div className="card max-w-lg">
          <div className="empty-state">
            <QrCode size={56} />
            <h3>No Appointments Found</h3>
            <p className="text-muted text-sm">Book an appointment first to get your QR code.</p>
          </div>
        </div>
      ) : (
        <div className="qr-page-layout">

          {/* Left — Appointment Selector */}
          <div className="card qr-selector-card">
            <h3 className="card-title mb-3">Select Appointment</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {allAppointments.map(a => (
                <div key={a.id}
                  className={`appt-select-item ${selected?.id === a.id ? 'appt-select-active' : ''}`}
                  onClick={() => setSelected(a)}>
                  <span className="token-num">#{a.token_number || '—'}</span>
                  <div style={{ flex: 1 }}>
                    <p className="fw-600 text-sm">{a.doctor_name}</p>
                    <p className="text-muted text-xs">{a.date}</p>
                  </div>
                  <span className={`badge ${
                    ['Waiting','confirmed'].includes(a.status) ? 'badge-warning' :
                    a.status === 'In-Consultation' ? 'badge-success' :
                    ['Completed','completed'].includes(a.status) ? 'badge-info' : 'badge-danger'
                  }`} style={{ fontSize: 10 }}>{a.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — QR Display */}
          {selected && (
            <div className="card qr-main-card">
              {/* Clinic Header */}
              <div className="qr-clinic-header">
                <div className="qr-clinic-logo">🏥</div>
                <div>
                  <h3 className="fw-800">MediCore Clinic</h3>
                  <p className="text-muted text-xs">Digital Appointment Pass</p>
                </div>
                <span className={`badge ${
                  ['Waiting','confirmed'].includes(selected.status) ? 'badge-warning' :
                  selected.status === 'In-Consultation' ? 'badge-success' : 'badge-info'
                }`}>● {selected.status}</span>
              </div>

              {/* Real QR Code */}
              <div className="qr-code-wrap" ref={qrRef}>
                <QRCodeSVG
                  value={qrValue}
                  size={220}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                  level="H"
                  includeMargin={true}
                />
              </div>

              <p className="text-muted text-xs" style={{ textAlign: 'center', marginTop: 4 }}>
                Scan this QR at reception counter
              </p>

              {/* Appointment Details */}
              <div className="qr-details-box">
                <div className="qr-detail-row">
                  <span><Hash size={13} /> Token Number</span>
                  <span className="fw-800 text-primary" style={{ fontSize: 18 }}>#{selected.token_number || '—'}</span>
                </div>
                <div className="qr-detail-row">
                  <span><User size={13} /> Doctor</span>
                  <span className="fw-600">{selected.doctor_name}</span>
                </div>
                <div className="qr-detail-row">
                  <span><Calendar size={13} /> Date</span>
                  <span className="fw-600">{selected.date}</span>
                </div>
                <div className="qr-detail-row">
                  <span><QrCode size={13} /> Appointment ID</span>
                  <span className="fw-600 text-xs" style={{ fontFamily: 'monospace' }}>
                    {selected.id?.slice(-10).toUpperCase()}
                  </span>
                </div>
                <div className="qr-detail-row">
                  <span>Reason</span>
                  <span className="fw-600 text-sm">{selected.reason_for_visit || '—'}</span>
                </div>
              </div>

              {/* Instructions */}
              <div className="qr-instructions">
                {[
                  'Show this QR code at the reception desk',
                  'Receptionist will scan to verify your appointment',
                  'You will be marked as checked-in',
                  'Wait for your token number to be called',
                ].map((step, i) => (
                  <div key={i} className="qr-instruction-row">
                    <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                    <span className="text-sm text-muted">{step}</span>
                  </div>
                ))}
              </div>

              {/* Download Button */}
              <button className="btn btn-primary w-full mt-3" onClick={downloadQR}>
                <Download size={15} /> Download QR Code
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
