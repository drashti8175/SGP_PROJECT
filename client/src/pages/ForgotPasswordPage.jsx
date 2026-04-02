import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { authService } from '../services/api'; // Import authService

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // Added for error handling

  const handleSubmit = async (e) => { // Made async
    e.preventDefault();
    setLoading(true);
    setError(''); // Clear previous errors

    try {
      const data = await authService.forgotPassword(email); // Call the new backend service
      if (data.resetLink) {
        setResetToken(data.resetLink.split('/').pop());
      }
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
          <p className="text-muted mt-2">A password reset link has been sent to <strong>{email}</strong>. Please check your inbox to continue.</p>
          
          {resetToken && (
            <div className="mt-4 p-4" style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid var(--border)' }}>
              <p className="text-sm fw-600 text-primary mb-3">Development Mode: Proceed to Reset</p>
              <Link to={`/reset-password/${resetToken}`} className="btn-login" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                Reset Password Now <ArrowRight size={16} />
              </Link>
            </div>
          )}
          <p className="text-muted text-xs mt-4">You can close this tab once you have reset your password.</p>
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
      </div>
    </div>
  );
}