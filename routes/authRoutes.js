const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const { JWT_SECRET, verifyToken } = require('../middleware/authMiddleware');

const User = require('../models/User');
const Doctor = require('../models/Doctor');

const resend = new Resend(process.env.RESEND_API_KEY);

// In-memory OTP store
const otpStore = new Map();

async function sendOTP(toEmail, otp) {
    // Try Resend first (works for drashtiipatel2006@gmail.com)
    // For all other emails, use nodemailer with a real SMTP
    try {
        const { data, error } = await resend.emails.send({
            from: 'MediCore Clinic <onboarding@resend.dev>',
            to: toEmail,
            subject: 'Your MediCore Registration OTP',
            html: `
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;">
                    <h2 style="color:#2563eb;margin-bottom:8px;">&#127973; MediCore Clinic</h2>
                    <p style="color:#475569;">Use the OTP below to complete your registration:</p>
                    <div style="font-size:40px;font-weight:900;letter-spacing:10px;color:#0f172a;background:#f1f5f9;padding:20px;border-radius:10px;text-align:center;margin:20px 0;">${otp}</div>
                    <p style="color:#64748b;font-size:13px;">Valid for <strong>10 minutes</strong>. Do not share this OTP.</p>
                </div>`
        });
        if (error) throw new Error(error.message);
        console.log(`✅ OTP sent via Resend to ${toEmail}`);
        return;
    } catch (e) {
        console.warn(`⚠️ Resend failed: ${e.message}. Trying SMTP...`);
    }

    // Fallback: nodemailer with Gmail SMTP
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: 'medicore.otp.service@gmail.com',
            pass: 'your_app_password'
        }
    });

    await transporter.sendMail({
        from: '"MediCore Clinic" <medicore.otp.service@gmail.com>',
        to: toEmail,
        subject: 'Your MediCore Registration OTP',
        html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;">
                <h2 style="color:#2563eb;">&#127973; MediCore Clinic</h2>
                <p>Your OTP for registration:</p>
                <div style="font-size:40px;font-weight:900;letter-spacing:10px;color:#0f172a;background:#f1f5f9;padding:20px;border-radius:10px;text-align:center;margin:20px 0;">${otp}</div>
                <p style="color:#64748b;font-size:13px;">Valid for 10 minutes.</p>
            </div>`
    });
    console.log(`✅ OTP sent via SMTP to ${toEmail}`);
}

// Send OTP
router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required.' });

        const emailLower = email.toLowerCase().trim();
        if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(emailLower))
            return res.status(400).json({ error: 'Only Gmail addresses are allowed.' });

        const existing = await User.findOne({ email: emailLower });
        if (existing) return res.status(400).json({ error: 'Email already registered.' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore.set(emailLower, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

        await sendOTP(emailLower, otp);

        res.json({ message: 'OTP sent to your email.' });
    } catch (err) {
        console.error('❌ OTP error:', err.message);
        res.status(500).json({ error: 'Failed to send OTP: ' + err.message });
    }
});

// Verify OTP
router.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required.' });
    const emailLower = email.toLowerCase().trim();
    const record = otpStore.get(emailLower);
    if (!record) return res.status(400).json({ error: 'OTP not found. Please request again.' });
    if (Date.now() > record.expiresAt) {
        otpStore.delete(emailLower);
        return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    }
    if (record.otp !== otp.trim()) return res.status(400).json({ error: 'Incorrect OTP.' });
    otpStore.delete(emailLower);
    res.json({ message: 'OTP verified.' });
});

// Register with username
router.post('/register-username', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });
        if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters.' });
        if (!/^[a-zA-Z0-9_]+$/.test(username)) return res.status(400).json({ error: 'Username can only contain letters, numbers and underscores.' });

        const existing = await User.findOne({ username: username.toLowerCase() });
        if (existing) return res.status(400).json({ error: 'Username already taken.' });

        const user = await User.create({
            name: username,
            username: username.toLowerCase(),
            password: bcrypt.hashSync(password, 10),
            role: 'patient'
        });
        console.log(`✅ New patient registered: ${user.username}`);
        res.json({ message: 'Registration successful!', userId: user._id });
    } catch (err) {
        console.error('❌ Registration Error:', err.message);
        res.status(500).json({ error: 'Database error.' });
    }
});

// Login with username
router.post('/login-username', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });

        const user = await User.findOne({
            $or: [
                { username: username.toLowerCase().trim() },
                { email: username.toLowerCase().trim() }
            ]
        });
        if (!user) return res.status(404).json({ error: 'No account found with this username.' });
        if (user.isActive === false) return res.status(403).json({ error: 'Account suspended. Contact admin.' });

        const isValid = bcrypt.compareSync(password, user.password);
        if (!isValid) return res.status(401).json({ error: 'Incorrect password.' });

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });

        if (user.role === 'doctor') {
            const doc = await Doctor.findOne({ userId: user._id });
            if (!doc) return res.status(403).json({ error: 'Doctor profile not found. Contact admin.' });
            return res.json({ success: true, token, role: user.role, name: user.name, doctor_id: doc._id, patientId: user._id });
        }
        res.json({ success: true, token, role: user.role, name: user.name, patientId: user._id });
    } catch (err) {
        console.error('❌ Login Error:', err.message);
        res.status(500).json({ error: 'Database error.' });
    }
});

// Reset password by username
router.post('/reset-password-username', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });
        const user = await User.findOne({ username: username.toLowerCase() });
        if (!user) return res.status(404).json({ error: 'No account found with this username.' });
        user.password = bcrypt.hashSync(password, 10);
        await user.save();
        res.json({ message: 'Password updated successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reset password.' });
    }
});

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'Missing required fields.' });
        const emailLower = email.toLowerCase().trim();
        if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(emailLower))
            return res.status(400).json({ error: 'Only Gmail addresses are allowed.' });
        const existingUser = await User.findOne({ email: emailLower });
        if (existingUser) return res.status(400).json({ error: 'Email already registered.' });
        const user = await User.create({
            name, email: emailLower,
            password: bcrypt.hashSync(password, 10),
            role: 'patient'
        });
        console.log(`✅ New patient registered: ${user.email}`);
        res.json({ message: 'Registration successful!', userId: user._id });
    } catch (err) {
        console.error('❌ Registration Error:', err.message);
        res.status(500).json({ error: 'Database error.' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Missing email or password.' });
        const emailLower = email.toLowerCase().trim();
        if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(emailLower))
            return res.status(400).json({ error: 'Only Gmail addresses are allowed.' });
        const user = await User.findOne({ email: emailLower });
        if (!user) return res.status(404).json({ error: 'No account found with this email.' });
        if (user.isActive === false)
            return res.status(403).json({ error: 'Your account has been suspended. Contact admin.' });
        const isValid = bcrypt.compareSync(password, user.password);
        if (!isValid) return res.status(401).json({ error: 'Incorrect password.' });
        if (user.role === 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin', isActive: { $ne: false } });
            if (adminCount > 1)
                return res.status(403).json({ error: 'Multiple admin accounts detected.' });
        }
        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
        if (user.role === 'doctor') {
            const doc = await Doctor.findOne({ userId: user._id });
            if (!doc) return res.status(403).json({ error: 'Doctor profile not found. Contact admin.' });
            return res.json({ success: true, token, role: user.role, name: user.name, doctor_id: doc._id, patientId: user._id });
        }
        res.json({ success: true, token, role: user.role, name: user.name, patientId: user._id });
    } catch (err) {
        console.error('❌ Login Error:', err.message);
        res.status(500).json({ error: 'Database error.' });
    }
});

// Get My Info
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found.' });
        res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
    } catch (err) { res.status(500).json({ error: 'Database error.' }); }
});

// Update Profile
router.patch('/update-profile', verifyToken, async (req, res) => {
    try {
        const { phone, gender, blood_group, dob } = req.body;
        await User.findByIdAndUpdate(req.userId, { phone, gender, blood_group, dob });
        res.json({ message: 'Profile updated' });
    } catch (err) { res.status(500).json({ error: 'Update failed' }); }
});

// Reset Password Direct
router.post('/reset-password-direct', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
        if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) return res.status(404).json({ error: 'No account found with that email address.' });
        user.password = bcrypt.hashSync(password, 10);
        await user.save();
        res.json({ message: 'Password updated successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reset password: ' + err.message });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required.' });
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'Email not registered' });
        const token = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
        await user.save();
        res.json({ message: 'Password reset link sent.' });
    } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) return res.status(400).json({ error: 'Token and password are required.' });
        const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
        if (!user) return res.status(400).json({ error: 'Invalid or expired token' });
        user.password = bcrypt.hashSync(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.json({ message: 'Password updated successfully!' });
    } catch (err) { res.status(500).json({ error: 'Failed to reset password.' }); }
});

module.exports = router;
