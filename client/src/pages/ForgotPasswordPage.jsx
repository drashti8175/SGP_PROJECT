import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/api'; // Import authService

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // Added for error handling

  const handleSubmit = async (e) => { // Made async
    e.preventDefault();
    setLoading(true);
    setError(''); // Clear previous errors

    try {
      await authService.forgotPassword(email); // Call the new backend service
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="login-bg">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <div className="brand-icon mb-4" style={{ margin: '0 auto' }}><CheckCircle2 size={48} color="#10b981" /></div>
          <h2 className="fw-800">Check Your Email</h2>
          <p className="text-muted mt-2">We've sent a password reset link to <strong>{email}</strong> if an account exists.</p>
          <Link to="/login" className="btn-login mt-4" style={{ display: 'block', textDecoration: 'none' }}>
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-icon"><Stethoscope size={28} /></div>
          <div>
            <h1>Reset Password</h1>
            <p>Enter email to receive a reset link</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="field-group">
            <label>Email Address</label>
            <div className="icon-input">
              <Mail size={16} className="input-icon" />
              <input type="email" placeholder="you@clinic.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>
          {error && <div className="error-msg">{error}</div>} {/* Display error */}
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <Link to="/login" className="forgot-link" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 20 }}>
          <ArrowLeft size={14} /> Back to Login
        </Link>
      </div>
    </div>
  );
}