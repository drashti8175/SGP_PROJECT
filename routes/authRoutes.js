const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { JWT_SECRET, verifyToken } = require('../middleware/authMiddleware');

const User = require('../models/User');
const Doctor = require('../models/Doctor');

// Patient Registration only — admin/doctor/receptionist cannot self-register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: "Missing required fields." });

        const emailLower = email.toLowerCase().trim();
        if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(emailLower))
            return res.status(400).json({ error: "Only Gmail addresses are allowed." });

        const existingUser = await User.findOne({ email: emailLower });
        if (existingUser) return res.status(400).json({ error: "Email already registered." });

        const user = await User.create({
            name,
            email: emailLower,
            password: bcrypt.hashSync(password, 10),
            role: 'patient'
        });

        console.log(`✅ New patient registered: ${user.email}`);
        res.json({ message: "Registration successful!", userId: user._id });
    } catch (err) {
        console.error("❌ Registration Error:", err.message);
        res.status(500).json({ error: "Database error." });
    }
});

// General Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Missing email or password." });

        const emailLower = email.toLowerCase().trim();

        // Gmail-only enforcement
        if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(emailLower))
            return res.status(400).json({ error: "Only Gmail addresses are allowed." });

        const user = await User.findOne({ email: emailLower });
        if (!user) return res.status(404).json({ error: "No account found with this email." });

        // Block if account is inactive/suspended
        if (user.isActive === false)
            return res.status(403).json({ error: "Your account has been suspended. Contact admin." });

        const isValid = bcrypt.compareSync(password, user.password);
        if (!isValid) return res.status(401).json({ error: "Incorrect password." });

        // Enforce single admin — only the seeded admin account can login as admin
        if (user.role === 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin', isActive: { $ne: false } });
            if (adminCount > 1)
                return res.status(403).json({ error: "Multiple admin accounts detected. Contact system administrator." });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });

        if (user.role === 'doctor') {
            const doc = await Doctor.findOne({ userId: user._id });
            if (!doc) return res.status(403).json({ error: "Doctor profile not found. Contact admin." });
            return res.json({ success: true, message: "Login successful", token, role: user.role, name: user.name, doctor_id: doc._id, patientId: user._id });
        }

        res.json({ success: true, message: "Login successful", token, role: user.role, name: user.name, patientId: user._id });
    } catch (err) {
        console.error("❌ Login Error:", err.message);
        res.status(500).json({ error: "Database error." });
    }
});

// Get My Info
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ error: "User not found." });
        res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
    } catch (err) { res.status(500).json({ error: "Database error." }); }
});

// Update Profile
router.patch('/update-profile', verifyToken, async (req, res) => {
    try {
        const { phone, gender, blood_group, dob } = req.body;
        await User.findByIdAndUpdate(req.userId, { phone, gender, blood_group, dob });
        res.json({ message: 'Profile updated' });
    } catch (err) { res.status(500).json({ error: 'Update failed' }); }
});

// Forgot Password Request
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email is required." });

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "Email not registered" });
        }

        // Generate secure random token
        const token = crypto.randomBytes(32).toString('hex');
        
        // Set expiry (15 minutes)
        const expiry = Date.now() + 15 * 60 * 1000;

        // Store token in database (assuming User model supports these fields)
        user.resetPasswordToken = token;
        user.resetPasswordExpires = expiry;
        await user.save();

        const resetLink = `http://localhost:5173/reset-password/${token}`;
        console.log(`✅ [DEBUG] Password reset requested for: ${user.email}`);
        console.log(`🔗 [SIMULATION] Reset Link: ${resetLink}`);

        res.json({ 
            message: 'Password reset link sent to your email',
            resetLink: resetLink // Provided for demo/testing
        });
    } catch (err) { res.status(500).json({ error: "Server error during request." }); }
});

router.post('/reset-password-direct', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Email and password are required." });
        if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            console.log(`❌ [RESET] No user found for email: ${email}`);
            return res.status(404).json({ error: "No account found with that email address." });
        }

        user.password = bcrypt.hashSync(password, 10);
        await user.save();
        console.log(`✅ [RESET] Password updated for: ${email}`);
        res.json({ message: "Password updated successfully!" });
    } catch (err) {
        console.error("❌ [RESET] Error:", err.message);
        res.status(500).json({ error: "Failed to reset password: " + err.message });
    }
});

// Actual Password Reset Logic
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) return res.status(400).json({ error: "Token and password are required." });

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: "Invalid or expired token" });
        }

        user.password = bcrypt.hashSync(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.json({ message: "Password updated successfully!" });
    } catch (err) { res.status(500).json({ error: "Failed to reset password." }); }
});

module.exports = router;
