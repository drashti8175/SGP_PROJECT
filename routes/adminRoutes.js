const express = require('express');
const router = express.Router();
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

router.use(verifyToken);
router.use(verifyRole(['admin']));

// 1. Analytics Dashboard
router.get('/stats', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Total patients today (pending, confirmed, complete)
        const total_patients = await Appointment.countDocuments({ 
            date: today, 
            status: { $nin: ['Cancelled', 'cancelled'] } 
        });
            
        // Total revenue (assuming $50 flat rate per paid appointment)
        const paid_count = await Appointment.countDocuments({ payment_status: 'paid' });
                
        // Total doctors
        const total_doctors = await Doctor.countDocuments({});

        res.json({
            patients_today: total_patients,
            total_revenue: paid_count * 50,
            total_doctors: total_doctors
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// 2. Fetch all system users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// 3. Fetch all doctors and details
router.get('/doctors', async (req, res) => {
    try {
        const doctors = await Doctor.find().populate('userId', 'name email');
        
        // Format to match old SQLite output: doctor_id, name, email, specialty, working_days
        const formattedDoctors = doctors.map(doc => ({
            doctor_id: doc._id,
            name: doc.userId ? doc.userId.name : 'Unknown',
            email: doc.userId ? doc.userId.email : 'Unknown',
            specialty: doc.specialization,
            working_days: doc.working_days
        }));

        res.json(formattedDoctors);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

module.exports = router;

