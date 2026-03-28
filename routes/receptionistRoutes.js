const express = require('express');
const router = express.Router();
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

const Appointment = require('../models/Appointment');

router.use(verifyToken);
router.use(verifyRole(['receptionist', 'admin']));

// 1. View all appointment requests
router.get('/requests', async (req, res) => {
    try {
        const appointments = await Appointment.find({
            status: { $in: ['pending', 'confirmed', 'Waiting', 'In-Consultation', 'Emergency', 'completed', 'Completed'] }
        })
        .populate('patient_id', 'name email')
        .populate({
            path: 'doctor_id',
            populate: { path: 'userId', select: 'name' }
        })
        .sort({ date: 1, token_number: 1 });

        const results = appointments.map(a => ({
            id: a._id,
            date: a.date,
            token_number: a.token_number,
            reason_for_visit: a.reason_for_visit,
            status: a.status,
            payment_status: a.payment_status,
            patient_name: a.patient_id ? a.patient_id.name : 'Unknown',
            patient_email: a.patient_id ? a.patient_id.email : 'Unknown',
            doctor_name: (a.doctor_id && a.doctor_id.userId) ? a.doctor_id.userId.name : 'Unknown'
        }));

        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// 2. Accept/Reject Appointments
router.post('/update_status', async (req, res) => {
    try {
        const { appointment_id, status } = req.body;
        if (!['confirmed', 'cancelled', 'Completed', 'Waiting'].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        await Appointment.findByIdAndUpdate(appointment_id, { status });

        const io = req.app.get('io');
        if (io) io.to('clinic_queue').emit('appointment_updated', { appointment_id, status });
        
        res.json({ message: `Appointment ${status}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// 3. Mark check-in (When patient arrives physically)
router.post('/checkin', async (req, res) => {
    try {
        const { appointment_id } = req.body;

        await Appointment.findByIdAndUpdate(appointment_id, { status: 'Waiting' });

        const io = req.app.get('io');
        if (io) io.to('clinic_queue').emit('queue_updated', { message: 'Patient checked in physically' });

        res.json({ message: "Patient checked into live queue" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// 4. Update Payment
router.post('/payment', async (req, res) => {
    try {
        const { appointment_id, payment_status } = req.body;

        await Appointment.findByIdAndUpdate(appointment_id, { payment_status });

        res.json({ message: `Payment marked as ${payment_status}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

module.exports = router;
