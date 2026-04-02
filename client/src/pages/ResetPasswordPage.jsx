import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { Stethoscope, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (password.length < 4) return setError("Password must be at least 4 characters.");

    setLoading(true);
    setError('');
    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) return <div className="login-bg"><div className="login-card">Invalid Reset Link</div></div>;

  if (success) return (
    <div className="login-bg">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <div className="brand-icon mb-4" style={{ margin: '0 auto' }}><CheckCircle2 size={48} color="#10b981" /></div>
        <h2 className="fw-800">Password Updated!</h2>
        <p className="text-muted mt-2">Your password has been reset successfully. Redirecting you to login...</p>
        <Link to="/login" className="btn-login mt-4" style={{ display: 'block', textDecoration: 'none' }}>Login Now</Link>
      </div>
    </div>
  );

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-icon"><Stethoscope size={28} /></div>
          <div>
            <h1>New Password</h1>
            <p>Please enter your new secure password</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="field-group">
            <label>New Password</label>
            <div className="icon-input pass-wrap">
              <Lock size={16} className="input-icon" />
              <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPass(!showPass)}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </div>
          <div className="field-group">
            <label>Confirm Password</label>
            <input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn-login" disabled={loading}>{loading ? 'Updating...' : 'Update Password'}</button>
        </form>
      </div>
    </div>
  );
}