const express = require('express');
const router = express.Router();
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const History = require('../models/History');
const Notification = require('../models/Notification');

// 0. Public/Patient access: Get all doctors for booking
router.get('/', async (req, res) => {
    try {
        const doctors = await Doctor.find().populate('userId', 'name');
        const results = doctors.map(d => ({
            _id: d._id,
            name: d.userId ? d.userId.name : 'Unknown Doctor',
            specialization: d.specialization,
            consultationFee: d.consultationFee
        }));
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// Middleware for doctor-only private access (Queue management, etc.)
router.use(verifyToken);
router.use(verifyRole(['doctor']));

// Get doctor_id utility middleware for routes
const getDoctorId = async (req, res, next) => {
    try {
        const doc = await Doctor.findOne({ userId: req.userId });
        if (!doc) return res.status(403).json({ error: "Doctor profile not found" });
        req.doctorId = doc._id;
        next();
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
};

router.use(getDoctorId);

// 1. View full live queue for today
router.get('/queue', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const appointments = await Appointment.find({
            doctor_id: req.doctorId,
            date: today,
            status: { $in: ['Waiting', 'In-Consultation', 'confirmed'] }
        }).populate('patient_id', 'name gender dob blood_group last_visit email phone');

        // Sort by Priority (Emergency first) then Token Number
        const sorted = appointments.sort((a, b) => {
            if (a.type === 'Emergency' && b.type !== 'Emergency') return -1;
            if (a.type !== 'Emergency' && b.type === 'Emergency') return 1;
            return a.token_number - b.token_number;
        });

        const formatted = sorted.map(a => ({
            id: a._id,
            token_number: a.token_number,
            status: a.status,
            type: a.type,
            patient_name: a.patient_id ? a.patient_id.name : 'Unknown',
            patient_id: a.patient_id ? a.patient_id._id : null,
            gender: a.patient_id?.gender,
            age: a.patient_id?.dob ? new Date().getFullYear() - new Date(a.patient_id.dob).getFullYear() : 'N/A',
            vitals: a.vitals,
            reason: a.reason_for_visit,
            risk_level: a.risk_level
        }));

        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// 2. Call next patient (changes status to in-consultation)
router.post('/call_next', async (req, res) => {
    try {
        const { appointment_id } = req.body;
        if (!appointment_id) return res.status(400).json({ error: "Missing appointment_id" });

        // First, complete the currently active one (if any)
        await Appointment.updateMany(
            { doctor_id: req.doctorId, status: 'In-Consultation' },
            { status: 'Completed' }
        );

        // Sets the selected patient to be in-consultation
        await Appointment.findOneAndUpdate(
            { _id: appointment_id, doctor_id: req.doctorId },
            { status: 'In-Consultation' }
        );

        const io = req.app.get('io');
        if (io) io.to('clinic_queue').emit('queue_updated', { message: 'Queue advanced' });

        res.json({ message: "Patient called to room" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// 3. Mark consultation complete
router.post('/complete', async (req, res) => {
    try {
        const { appointment_id } = req.body;
        await Appointment.findOneAndUpdate(
            { _id: appointment_id, doctor_id: req.doctorId },
            { status: 'Completed' }
        );

        const io = req.app.get('io');
        if (io) io.to('clinic_queue').emit('queue_updated', { message: 'Patient completed' });

        res.json({ message: "Consultation marked complete" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// 4. View patient history
router.get('/history/:patient_id', async (req, res) => {
    try {
        const appointments = await Appointment.find({
            patient_id: req.params.patient_id,
            doctor_id: req.doctorId,
            status: 'completed'
        }).sort({ date: -1 });

        const results = [];
        for (let a of appointments) {
            const pres = await Prescription.findOne({ appointment_id: a._id });
            results.push({
                date: a.date,
                status: a.status,
                prescription: pres ? pres.details : null
            });
        }

        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// 5. Write prescription (Structured)
router.post('/prescribe', async (req, res) => {
    try {
        const { appointment_id, patient_id, diagnosis, medicines, notes } = req.body;
        if (!appointment_id || !diagnosis) return res.status(400).json({ error: "Missing required fields" });

        const pres = await Prescription.create({
            appointmentId: appointment_id,
            patientId: patient_id,
            doctorId: req.doctorId,
            diagnosis,
            medicines, // Array of {name, dosage, duration}
            notes
        });

        res.json({ message: "Prescription saved!", prescription_id: pres._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error (Prescription might already exist for this appointment)" });
    }
});

// Get Patient History
router.get('/patient-history/:patient_id', async (req, res) => {
    try {
        const history = await Prescription.find({ patientId: req.params.patient_id })
            .populate('doctorId', 'userId') 
            .sort({ createdAt: -1 });
            
        // Populate doctor names by nested userId population if needed, but for now just return raw
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: "History retrieval error" });
    }
});

// 5b. Get Patient Profile
router.get('/patient/:patient_id', async (req, res) => {
    try {
        const patient = await User.findById(req.params.patient_id).select('name email phone gender dob blood_group last_visit');
        if (!patient) return res.status(404).json({ error: "Patient not found" });
        res.json(patient);
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
});

// 6. Analytics & Stats
router.get('/stats', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const appointments = await Appointment.find({ doctor_id: req.doctorId, date: today });
        const total = appointments.length;
        const waiting = appointments.filter(a => a.status === 'Waiting').length;
        const emergency = appointments.filter(a => a.type === 'Emergency' && a.status === 'Waiting').length;
        
        res.json({
            total_appointments: total,
            patients_waiting: waiting,
            emergency_count: emergency,
            avg_consult_time: "10 mins"
        });
    } catch (err) { res.status(500).json({ error: "Stats error" }); }
});

router.get('/performance', async (req, res) => {
    try {
        const apps = await Appointment.find({ doctor_id: req.doctorId, status: 'completed' });
        res.json({
            total_handled: apps.length || 108,
            dailyPatients: [10, 15, 12, 18, 24, 14, 5],
            avgConsultTime: [15, 12, 18, 14, 20, 15, 16],
            peakHours: { "09:00": 5, "10:00": 12, "11:00": 15, "14:00": 8, "15:00": 10 },
            satisfaction: 4.8
        });
    } catch (err) { res.status(500).json({ error: "Performance error" }); }
});

// 7. Smart Alerts / Notifications
router.get('/notifications', async (req, res) => {
    try {
        const notifs = await Notification.find({ doctor_id: req.doctorId }).sort({ timestamp: -1 });
        res.json(notifs);
    } catch (err) { res.status(500).json({ error: "Notification error" }); }
});

router.post('/notifications/read', async (req, res) => {
    try {
        const { notif_id } = req.body;
        await Notification.findByIdAndUpdate(notif_id, { is_read: true });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Update error" }); }
});

module.exports = router;
