import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Mail, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirm, setConfirm]           = useState('');
  const [showPass, setShowPass]         = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState(false);

  // Live validation helpers
  const minLen     = password.length >= 8;
  const hasUpper   = /[A-Z]/.test(password);
  const hasNumber  = /[0-9]/.test(password);
  const passMatch  = confirm.length > 0 && password === confirm;
  const passMismatch = confirm.length > 0 && password !== confirm;

  const Rule = ({ ok, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
      color: ok ? '#10b981' : '#94a3b8', marginBottom: 2 }}>
      <span>{ok ? '✓' : '○'}</span> {label}
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!minLen || !hasUpper || !hasNumber) return setError('Password does not meet requirements.');
    if (password !== confirm) return setError('Passwords do not match.');

    setLoading(true);
    setError('');
    try {
      await authService.resetPasswordDirect(email, password);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. Check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="login-bg">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <div className="brand-icon mb-4" style={{ margin: '0 auto' }}><CheckCircle2 size={48} color="#10b981" /></div>
        <h2 className="fw-800">Password Reset!</h2>
        <p className="text-muted mt-2">Your password has been updated successfully.</p>
        <Link to="/login" className="btn-login mt-4" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
          Back to Sign In
        </Link>
      </div>
    </div>
  );

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-icon"><Stethoscope size={28} /></div>
          <div>
            <h1>Reset Password</h1>
            <p>Enter your email and choose a new password</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="field-group">
            <label>Email Address</label>
            <div className="icon-input">
              <Mail size={16} className="input-icon" />
              <input type="email" placeholder="you@clinic.com" value={email}
                onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>

          <div className="field-group">
            <label>New Password</label>
            <div className="icon-input pass-wrap">
              <Lock size={16} className="input-icon" />
              <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }} required />
              <button type="button" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <Rule ok={minLen}   label="At least 8 characters" />
                <Rule ok={hasUpper} label="At least one uppercase letter" />
                <Rule ok={hasNumber} label="At least one number" />
              </div>
            )}
          </div>

          <div className="field-group">
            <label>Confirm Password</label>
            <div className="icon-input" style={{ borderColor: passMismatch ? '#ef4444' : passMatch ? '#10b981' : undefined }}>
              <Lock size={16} className="input-icon" />
              <input type="password" placeholder="••••••••" value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(''); }} required />
            </div>
            {passMatch    && <div style={{ color: '#10b981', fontSize: 12, marginTop: 4 }}>✓ Passwords match</div>}
            {passMismatch && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>✗ Passwords do not match</div>}
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button type="submit" className="btn-login"
            disabled={loading || !minLen || !hasUpper || !hasNumber || !passMatch}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="text-center text-muted text-sm mt-3">
          <Link to="/login" style={{ color: 'var(--primary)' }}>← Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
