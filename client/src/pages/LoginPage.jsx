import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../App';
import { Stethoscope, Eye, EyeOff, UserPlus, LogIn, Mail, Lock, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await authService.login(form.email, form.password);
      login(data);
      navigate(`/${data.role}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed.';
      // Clear stale token if exists
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setError(msg);
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await authService.register(form.name, form.email, form.password);
      setMode('login');
      setError('');
      alert('Registration successful! Please login.');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const handleResetPasswordDirect = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');

    setError(''); setLoading(true);
    try {
      await authService.resetPasswordDirect(form.email, form.password);
      alert('Password reset successfully!');
      setMode('login');
      setForm(f => ({ ...f, password: '', confirmPassword: '' }));
    } catch (err) {
      console.error("Reset Error:", err);
      const serverError = err.response?.data?.error;
      const networkError = !err.response ? "Server unreachable. Is your backend running?" : null;
      setError(serverError || networkError || 'Reset failed.');
    } finally { setLoading(false); }
  };

  const demoAccounts = [
    { label: 'Patient', email: 'sachet@gmail.com', password: '1234', color: '#10b981', icon: '🧑‍⚕️' },
    { label: 'Doctor', email: 'sushma@clinic.com', password: '1234', color: '#2563eb', icon: '👨‍⚕️' },
    { label: 'Receptionist', email: 'reception@clinic.com', password: '1234', color: '#0891b2', icon: '🏥' },
    { label: 'Admin', email: 'admin@clinic.com', password: '1234', color: '#7c3aed', icon: '⚙️' },
  ];

  const fillDemo = (acc) => setForm({ name: '', email: acc.email, password: acc.password });

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-icon"><Stethoscope size={28} /></div>
          <div>
            <h1>MediCore</h1>
            <p>Clinic Management System</p>
          </div>
        </div>

        {mode !== 'forgot' && (
          <div className="tab-switch">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>
              <LogIn size={14} /> Sign In
            </button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }}>
              <UserPlus size={14} /> Register
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {mode === 'forgot' ? (
              <form onSubmit={handleResetPasswordDirect} className="login-form">
                <div className="field-group">
                  <label>Email Address</label>
                  <div className="icon-input">
                    <Mail size={16} className="input-icon" />
                    <input type="email" placeholder="you@clinic.com" value={form.email} onChange={e => set('email', e.target.value)} required />
                  </div>
                </div>
                <div className="field-group">
                  <label>New Password</label>
                  <div className="icon-input pass-wrap">
                    <Lock size={16} className="input-icon" />
                    <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
                    <button type="button" onClick={() => setShowPass(s => !s)}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                </div>
                <div className="field-group">
                  <label>Confirm Password</label>
                  <div className="icon-input pass-wrap">
                    <Lock size={16} className="input-icon" />
                    <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required />
                    <button type="button" onClick={() => setShowPass(s => !s)}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                </div>
                {error && <div className="error-msg">{error}</div>}
                <button type="submit" className="btn-login" disabled={loading}>
                  {loading ? 'Processing...' : 'Reset Password'}
                </button>
                <button type="button" className="forgot-link" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 20, width: '100%', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => { setMode('login'); setError(''); }}>
                  <ArrowLeft size={14} /> Back to Sign In
                </button>
              </form>
            ) : (
              <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="login-form">
                {mode === 'register' && (
                  <div className="field-group">
                    <label>Full Name</label>
                    <input type="text" placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)} required />
                  </div>
                )}
                <div className="field-group">
                  <label>Email Address</label>
                  <div className="icon-input">
                    <Mail size={16} className="input-icon" />
                    <input type="email" placeholder="you@clinic.com" value={form.email} onChange={e => set('email', e.target.value)} required />
                  </div>
                </div>
                <div className="field-group">
                  <label>Password</label>
                  <div className="icon-input pass-wrap">
                    <Lock size={16} className="input-icon" />
                    <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
                    <button type="button" onClick={() => setShowPass(s => !s)}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                  {mode === 'login' && <span onClick={() => { setMode('forgot'); setError(''); }} className="forgot-link" style={{ cursor: 'pointer' }}>Forgot Password?</span>}
                </div>
                {error && <div className="error-msg">{error}</div>}
                <button type="submit" className="btn-login" disabled={loading}>
                  {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>
            )}
          </motion.div>
        </AnimatePresence>


      </div>
    </div>
  );
}
