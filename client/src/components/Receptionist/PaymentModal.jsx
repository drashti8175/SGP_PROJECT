import React, { useState } from 'react';
import { receptionistService } from '../../services/api';
import { CreditCard, CheckCircle2, X, Banknote, Smartphone, Receipt } from 'lucide-react';

const PAYMENT_METHODS = [
  { key: 'cash',   label: 'Cash',    icon: '💵' },
  { key: 'card',   label: 'Card',    icon: '💳' },
  { key: 'upi',    label: 'UPI',     icon: '📱' },
  { key: 'online', label: 'Online',  icon: '🌐' },
];

export default function PaymentModal({ appointment, onClose, onSuccess }) {
  const [method, setMethod] = useState('cash');
  const [amount, setAmount] = useState(appointment?.consultation_fee || 300);
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const handlePay = async () => {
    setLoading(true);
    try {
      await receptionistService.updatePayment(appointment.id, 'paid', method, amount);
      setReceipt({
        patient: appointment.patient_name,
        doctor: appointment.doctor_name,
        token: appointment.token_number,
        amount,
        method,
        date: new Date().toLocaleString('en-IN'),
        id: appointment.id?.slice(-8).toUpperCase()
      });
    } catch (e) {
      alert('Payment failed. Try again.');
    } finally { setLoading(false); }
  };

  // Receipt view after payment
  if (receipt) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="payment-receipt">
          <div className="receipt-header">
            <div className="receipt-logo">🏥</div>
            <h3 className="fw-800">MediCore Clinic</h3>
            <p className="text-muted text-xs">Payment Receipt</p>
          </div>
          <div className="receipt-success">
            <CheckCircle2 size={40} style={{ color: '#10b981' }} />
            <h3 className="fw-700 text-success">Payment Successful!</h3>
          </div>
          <div className="receipt-details">
            <div className="receipt-row"><span>Receipt No.</span><span className="fw-700">#{receipt.id}</span></div>
            <div className="receipt-row"><span>Patient</span><span className="fw-600">{receipt.patient}</span></div>
            <div className="receipt-row"><span>Doctor</span><span className="fw-600">{receipt.doctor}</span></div>
            <div className="receipt-row"><span>Token</span><span className="fw-600">#{receipt.token}</span></div>
            <div className="receipt-row"><span>Date & Time</span><span className="fw-600">{receipt.date}</span></div>
            <div className="receipt-row"><span>Method</span>
              <span className="fw-600 text-primary">{PAYMENT_METHODS.find(m => m.key === receipt.method)?.icon} {receipt.method.toUpperCase()}</span>
            </div>
            <div className="receipt-row receipt-total">
              <span className="fw-700">Amount Paid</span>
              <span className="fw-900 text-success" style={{ fontSize: 20 }}>₹{receipt.amount}</span>
            </div>
          </div>
          <button className="btn btn-primary w-full mt-3" onClick={() => { onSuccess(); onClose(); }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="fw-700"><CreditCard size={18} /> Collect Payment</h3>
          <button className="btn btn-xs btn-outline" onClick={onClose}><X size={14} /></button>
        </div>

        {/* Patient Info */}
        <div className="payment-patient-info">
          <div className="patient-avatar">{appointment.patient_name?.charAt(0)}</div>
          <div>
            <p className="fw-700">{appointment.patient_name}</p>
            <p className="text-muted text-sm">Dr. {appointment.doctor_name} · Token #{appointment.token_number}</p>
            <p className="text-muted text-xs">{appointment.reason_for_visit}</p>
          </div>
        </div>

        {/* Amount */}
        <div className="field-group mt-3">
          <label className="fw-600">Consultation Fee (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', textAlign: 'center', padding: '12px', border: '2px solid var(--primary)', borderRadius: 10 }}
          />
        </div>

        {/* Payment Method */}
        <div className="field-group mt-3">
          <label className="fw-600">Payment Method</label>
          <div className="payment-methods-grid">
            {PAYMENT_METHODS.map(m => (
              <div key={m.key}
                className={`payment-method-btn ${method === m.key ? 'pm-selected' : ''}`}
                onClick={() => setMethod(m.key)}>
                <span style={{ fontSize: 24 }}>{m.icon}</span>
                <span className="fw-600 text-sm">{m.label}</span>
                {method === m.key && <CheckCircle2 size={14} style={{ color: 'var(--primary)', position: 'absolute', top: 6, right: 6 }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="payment-summary">
          <div className="ps-row"><span>Patient</span><span className="fw-600">{appointment.patient_name}</span></div>
          <div className="ps-row"><span>Doctor</span><span className="fw-600">{appointment.doctor_name}</span></div>
          <div className="ps-row"><span>Method</span><span className="fw-600">{method.toUpperCase()}</span></div>
          <div className="ps-row ps-total"><span className="fw-700">Total Amount</span><span className="fw-900 text-success" style={{ fontSize: 18 }}>₹{amount}</span></div>
        </div>

        <button className="btn btn-success w-full mt-3" onClick={handlePay} disabled={loading || !amount}>
          <CreditCard size={16} /> {loading ? 'Processing...' : `Collect ₹${amount} via ${method.toUpperCase()}`}
        </button>
      </div>
    </div>
  );
}
