import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Stethoscope, CalendarPlus, Clock, Shield, Phone,
  MapPin, ChevronRight, Star, Users, Award, Heart
} from 'lucide-react';

export default function PatientHome() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="home-page">
      {/* ── Navbar ── */}
      <nav className="home-nav">
        <div className="home-nav-brand">
          <div className="home-nav-icon"><Stethoscope size={20} /></div>
          <span>MediCore</span>
        </div>
        <div className="home-nav-links">
          <a href="#features">Features</a>
          <a href="#how">How It Works</a>
          <a href="#clinic">Clinic Info</a>
        </div>
        <div className="home-nav-actions">
          <button className="btn btn-outline" onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn btn-primary" onClick={() => { navigate('/login'); }}>Register Free</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="home-hero">
        <motion.div className="hero-content"
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="hero-badge">🏥 Trusted by 10,000+ Patients</span>
          <h1 className="hero-title">Your Health,<br /><span className="hero-highlight">Our Priority</span></h1>
          <p className="hero-sub">
            Book appointments online, track your queue in real-time, and access your complete medical records — all from one place.
          </p>
          <div className="hero-btns">
            <button className="btn btn-white btn-lg" onClick={() => navigate('/login')}>
              <CalendarPlus size={18} /> Book Appointment
            </button>
            <button className="btn btn-outline-white btn-lg" onClick={() => navigate('/login')}>
              <Clock size={18} /> Check Queue Status
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><strong>500+</strong><span>Doctors</span></div>
            <div className="hero-stat-divider" />
            <div className="hero-stat"><strong>10K+</strong><span>Patients</span></div>
            <div className="hero-stat-divider" />
            <div className="hero-stat"><strong>4.9★</strong><span>Rating</span></div>
          </div>
        </motion.div>

        <motion.div className="hero-visual"
          initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <div className="hero-phone-mockup">
            <div className="hpm-header">
              <div className="hpm-dot" /><div className="hpm-dot" /><div className="hpm-dot" />
            </div>
            <div className="hpm-body">
              <p className="text-xs text-muted fw-600 uppercase mb-2">Your Queue Status</p>
              <div className="hpm-token">
                <span className="text-muted text-xs">Token</span>
                <h1 style={{ fontSize: 48, fontWeight: 900, color: '#2563eb' }}>#07</h1>
              </div>
              <div className="hpm-row"><span className="text-muted text-sm">Now Serving</span><span className="fw-700">#05</span></div>
              <div className="hpm-row"><span className="text-muted text-sm">Patients Ahead</span><span className="fw-700">2</span></div>
              <div className="hpm-row"><span className="text-muted text-sm">Est. Wait</span><span className="fw-700 text-primary">~20 min</span></div>
              <div className="hpm-arrival">🕐 Arrive by 10:30 – 10:45 AM</div>
              <div className="hpm-doctor">
                <div className="hpm-doc-avatar">S</div>
                <div>
                  <p className="fw-700 text-sm">Dr. Sushma</p>
                  <p className="text-muted text-xs">Cardiologist</p>
                </div>
                <span className="badge badge-success" style={{ marginLeft: 'auto' }}>Available</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="home-features" id="features">
        <div className="section-header">
          <h2 className="section-title">Everything You Need</h2>
          <p className="section-sub">A complete digital health experience for every patient</p>
        </div>
        <div className="features-grid">
          {[
            { icon: '📅', title: 'Easy Booking', desc: 'Book appointments with your preferred doctor in seconds. Choose date, time, and reason.' },
            { icon: '⏱️', title: 'Real-Time Queue', desc: 'Track your exact position in the queue live. No need to sit and wait at the clinic.' },
            { icon: '🕐', title: 'Smart Arrival Time', desc: 'We predict the best time for you to arrive based on queue length and consultation speed.' },
            { icon: '📋', title: 'Digital Records', desc: 'Access your complete prescription history, diagnoses, and doctor notes anytime.' },
            { icon: '📲', title: 'QR Check-In', desc: 'Get a unique QR code for your appointment. Scan at reception for instant check-in.' },
            { icon: '🔒', title: 'Secure & Private', desc: 'Your health data is encrypted with JWT authentication and role-based access control.' },
          ].map((f, i) => (
            <motion.div key={i} whileHover={{ y: -6, boxShadow: '0 12px 40px rgba(0,0,0,0.1)' }}
              className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p className="text-muted text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="home-steps" id="how">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-sub">From registration to consultation in 6 simple steps</p>
        </div>
        <div className="steps-flow">
          {[
            { icon: '👤', step: '01', title: 'Register', desc: 'Create your free patient account' },
            { icon: '📅', step: '02', title: 'Book', desc: 'Select doctor & describe your issue' },
            { icon: '🔢', step: '03', title: 'Get Token', desc: 'Receive your queue token number' },
            { icon: '⏱️', step: '04', title: 'Track Queue', desc: 'Monitor your position in real-time' },
            { icon: '📲', step: '05', title: 'QR Check-In', desc: 'Scan QR at reception on arrival' },
            { icon: '🩺', step: '06', title: 'Consult', desc: 'Meet doctor & get prescription' },
          ].map((s, i) => (
            <React.Fragment key={i}>
              <div className="step-box">
                <div className="step-num">{s.step}</div>
                <div className="step-emoji">{s.icon}</div>
                <h4 className="fw-700">{s.title}</h4>
                <p className="text-muted text-xs">{s.desc}</p>
              </div>
              {i < 5 && <div className="step-connector"><ChevronRight size={20} /></div>}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ── Doctors ── */}
      <section className="home-doctors">
        <div className="section-header">
          <h2 className="section-title">Our Specialists</h2>
          <p className="section-sub">Experienced doctors across all specializations</p>
        </div>
        <div className="doctors-preview-grid">
          {[
            { name: 'Dr. Sushma', spec: 'Cardiologist', exp: '12 yrs', rating: 4.9, fee: '₹500' },
            { name: 'Dr. Hemant', spec: 'General Physician', exp: '8 yrs', rating: 4.7, fee: '₹300' },
            { name: 'Dr. Priya', spec: 'Dermatologist', exp: '10 yrs', rating: 4.8, fee: '₹400' },
          ].map((d, i) => (
            <div key={i} className="doctor-preview-card">
              <div className="dpc-avatar">{d.name.charAt(3)}</div>
              <h4 className="fw-700">{d.name}</h4>
              <p className="text-muted text-sm">{d.spec}</p>
              <div className="dpc-meta">
                <span><Award size={12} /> {d.exp}</span>
                <span><Star size={12} /> {d.rating}</span>
                <span>{d.fee}</span>
              </div>
              <button className="btn btn-primary w-full btn-sm mt-2" onClick={() => navigate('/login')}>
                Book Now
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Clinic Info ── */}
      <section className="home-clinic" id="clinic">
        <div className="section-header">
          <h2 className="section-title">Visit Us</h2>
        </div>
        <div className="clinic-info-grid">
          <div className="clinic-info-card">
            <MapPin size={28} className="text-primary" />
            <h4>Address</h4>
            <p className="text-muted">123 Health Street, Medical District<br />Mumbai — 400001</p>
          </div>
          <div className="clinic-info-card">
            <Clock size={28} className="text-primary" />
            <h4>Working Hours</h4>
            <p className="text-muted">Mon – Sat: 9:00 AM – 6:00 PM</p>
            <p className="text-muted">Sunday: Emergency Only</p>
          </div>
          <div className="clinic-info-card">
            <Phone size={28} className="text-primary" />
            <h4>Contact</h4>
            <p className="text-muted">+91 98765 43210</p>
            <p className="text-muted">info@medicore.clinic</p>
          </div>
          <div className="clinic-info-card">
            <Heart size={28} className="text-primary" />
            <h4>Emergency</h4>
            <p className="text-muted">24/7 Emergency Line</p>
            <p className="text-muted fw-700">+91 99999 00000</p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="home-cta">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
          <h2>Ready to take control of your health?</h2>
          <p>Join thousands of patients managing their healthcare smarter with MediCore.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
            <button className="btn btn-white btn-lg" onClick={() => navigate('/login')}>
              <CalendarPlus size={18} /> Book Appointment
            </button>
            <button className="btn btn-outline-white btn-lg" onClick={() => navigate('/login')}>
              Sign In
            </button>
          </div>
        </motion.div>
      </section>

      <footer className="home-footer">
        <div className="footer-brand">
          <Stethoscope size={18} /> MediCore
        </div>
        <p>© 2025 MediCore Clinic Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}
