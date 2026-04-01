const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, verifyToken } = require('../middleware/authMiddleware');

const User = require('../models/User');
const Doctor = require('../models/Doctor');

// Patient Registration
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: "Missing required fields." });

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Email already exists." });

        const hashedPassword = bcrypt.hashSync(password, 10);
        const role = 'patient';

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role
        });

        console.log(`✅ [DEBUG] New User Saved: ${user.email} (Role: ${user.role})`);
        res.json({ message: "Registration successful!", userId: user._id });
    } catch (err) {
        console.error("❌ [DEBUG] Registration Error:", err.message);
        res.status(500).json({ error: "Database error." });
    }
});

// General Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`🔍 [DEBUG] Login Query for Email: ${email}`);
        
        if (!email || !password) return res.status(400).json({ error: "Missing email or password." });

        const user = await User.findOne({ email });
        if (!user) {
            console.log(`⚠️ [DEBUG] User not found for email: ${email}`);
            return res.status(404).json({ error: "User not found." });
        }

        console.log(`👤 [DEBUG] Fetched User:`, { id: user._id, email: user.email, role: user.role });

        const isValid = bcrypt.compareSync(password, user.password);
        if (!isValid) {
            console.log(`❌ [DEBUG] Invalid password attempt for: ${email}`);
            return res.status(401).json({ error: "Invalid credentials." });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
        
        // If doctor, also return doctor_id
        if (user.role === 'doctor') {
            const doc = await Doctor.findOne({ userId: user._id });
            return res.json({ 
                success: true,
                message: "Login successful", 
                token, 
                role: user.role, 
                name: user.name, 
                doctor_id: doc ? doc._id : null,
                patientId: user._id // Shared ID for simplicity
            });
        } else {
            res.json({ 
                success: true,
                message: "Login successful", 
                token, 
                role: user.role, 
                name: user.name,
                patientId: user._id 
            });
        }
    } catch (err) {
        console.error("❌ [DEBUG] Login Error:", err.message);
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

module.exports = router;
