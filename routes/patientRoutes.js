const express = require('express');
const router = express.Router();
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');

// Middleware for patient access
router.use(verifyToken);
router.use(verifyRole(['patient']));

// 1. Get List of Doctors
router.get('/doctors', async (req, res) => {
    try {
        const doctors = await Doctor.find().populate('userId', 'name');
        
        const results = doctors.map(d => ({
            doctor_id: d._id,
            name: d.userId ? d.userId.name : 'Unknown',
            specialization: d.specialization,
            consultationFee: d.consultationFee
        }));
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// 2. Book Appointment (Queue-based)
router.post('/book', async (req, res) => {
    try {
        const { doctor_id, reason_for_visit, type } = req.body;
        if (!doctor_id || !reason_for_visit) return res.status(400).json({ error: "Doctor and Reason for Visit are required." });

        const today = new Date().toISOString().split('T')[0];

        // Generate Token Number (incremental per doctor per day)
        const count = await Appointment.countDocuments({ doctor_id, date: today });
        const token_number = count + 1;

        const appt = await Appointment.create({
            patient_id: req.userId,
            doctor_id,
            date: today,
            token_number,
            reason_for_visit,
            type: type || 'Normal',
            status: 'Waiting'
        });

        const io = req.app.get('io');
        if (io) io.to('clinic_queue').emit('new_appointment', { message: 'New patient added to queue' });

        res.json({ 
            success: true,
            message: "Appointment booked successfully!", 
            token_number,
            appointment_id: appt._id 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to book appointment" });
    }
});

// 3. Get Patient's Appointments
router.get('/appointments', async (req, res) => {
    try {
        const appointments = await Appointment.find({ patient_id: req.userId })
            .populate({
                path: 'doctor_id',
                populate: { path: 'userId', select: 'name' }
            })
            .sort({ date: -1 });

        const results = appointments.map(a => ({
            id: a._id,
            date: a.date,
            status: a.status,
            payment_status: a.payment_status,
            doctor_name: (a.doctor_id && a.doctor_id.userId) ? a.doctor_id.userId.name : 'Unknown',
            specialty: a.doctor_id ? a.doctor_id.specialization : 'Unknown',
            reason_for_visit: a.reason_for_visit
        }));

        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// 4. Get Live Queue Status & Wait Time Estimation
router.get('/queue/:doctor_id', async (req, res) => {
    try {
        const doctor_id = req.params.doctor_id;
        const today = new Date().toISOString().split('T')[0];

        // Fetch all active appointments for this doctor today
        const allActive = await Appointment.find({
            doctor_id,
            date: today,
            status: { $in: ['Waiting', 'In-Consultation'] }
        });

        // Sort by Priority (Emergency first) then Token Number
        const sortedQueue = allActive.sort((a, b) => {
            if (a.type === 'Emergency' && b.type !== 'Emergency') return -1;
            if (a.type !== 'Emergency' && b.type === 'Emergency') return 1;
            return a.token_number - b.token_number;
        });

        let myPosition = -1;
        let currentServingToken = null;
        const inConsultation = sortedQueue.find(a => a.status.toLowerCase() === 'in-consultation');
        if (inConsultation) currentServingToken = inConsultation.token_number;

        // Find calling patient's position
        for (let i = 0; i < sortedQueue.length; i++) {
            if (sortedQueue[i].patient_id.toString() === req.userId.toString()) {
                myPosition = i + 1; // 1-based position
                break;
            }
        }

        const patientsAhead = myPosition > 1 ? myPosition - 1 : 0;
        const estimatedWaitMins = patientsAhead * 10; // 10 mins per patient

        res.json({
            token_number: sortedQueue.find(a => a.patient_id.toString() === req.userId.toString())?.token_number,
            current_serving_token: currentServingToken || 'None',
            queue_position: myPosition !== -1 ? myPosition : null,
            patients_ahead: patientsAhead,
            estimated_wait_time_mins: myPosition !== -1 ? estimatedWaitMins : null,
            status: myPosition === 1 && inConsultation ? 'In-Consultation' : 'Waiting',
            reason_for_visit: sortedQueue.find(a => a.patient_id.toString() === req.userId.toString())?.reason_for_visit,
            is_my_turn: inConsultation && inConsultation.patient_id.toString() === req.userId.toString()
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// 5. Get Prescriptions
router.get('/prescriptions', async (req, res) => {
    try {
        const prescriptions = await Prescription.find({ patientId: req.userId })
            .populate({
                path: 'appointmentId',
                select: 'date type token_number'
            })
            .populate({
                path: 'doctorId',
                populate: { path: 'userId', select: 'name' }
            })
            .sort({ createdAt: -1 });

        const results = prescriptions.map(p => ({
            id: p._id,
            diagnosis: p.diagnosis,
            medicines: p.medicines,
            notes: p.notes,
            created_at: p.createdAt,
            date: p.appointmentId ? p.appointmentId.date : null,
            doctor_name: (p.doctorId && p.doctorId.userId) ? p.doctorId.userId.name : 'Unknown'
        }));

        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// 4. Get full queue for a doctor (Public visibility)
router.get('/full-queue/:doctor_id', async (req, res) => {
    try {
        const { doctor_id } = req.params;
        const today = new Date().toISOString().split('T')[0];
        
        const appointments = await Appointment.find({
            doctor_id,
            date: today,
            status: { $in: ['Waiting', 'confirmed', 'In-Consultation'] }
        }).populate('patient_id', 'name');

        const fullQueue = appointments.sort((a,b) => a.token_number - b.token_number).map(a => ({
            token_number: a.token_number,
            patient_name: a.patient_id ? a.patient_id.name : 'Unknown',
            status: a.status
        }));
        
        res.json(fullQueue);
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
});

module.exports = router;

