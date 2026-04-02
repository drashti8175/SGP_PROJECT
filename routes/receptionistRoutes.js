const express = require('express');
const router = express.Router();
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');

const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

router.use(verifyToken);
router.use(verifyRole(['receptionist', 'admin']));

// 1. All appointments
router.get('/requests', async (req, res) => {
    try {
        const appointments = await Appointment.find({
            status: { $in: ['pending', 'confirmed', 'Waiting', 'In-Consultation', 'Emergency', 'completed', 'Completed', 'Cancelled', 'cancelled'] }
        })
        .populate('patient_id', 'name email phone')
        .populate({ path: 'doctor_id', populate: { path: 'userId', select: 'name' } })
        .sort({ date: -1, token_number: 1 });

        res.json(appointments.map(a => ({
            id: a._id,
            date: a.date,
            token_number: a.token_number,
            reason_for_visit: a.reason_for_visit,
            status: a.status,
            type: a.type,
            payment_status: a.payment_status,
            risk_level: a.risk_level,
            patient_name: a.patient_id?.name || 'Unknown',
            patient_email: a.patient_id?.email || '',
            patient_phone: a.patient_id?.phone || '',
            patient_id: a.patient_id?._id,
            doctor_name: a.doctor_id?.userId?.name || 'Unknown',
            doctor_id: a.doctor_id?._id,
        })));
    } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

// 2. Today's appointments + stats
router.get('/dashboard-stats', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const todayAppts = await Appointment.find({ date: today })
            .populate('patient_id', 'name email phone gender dob blood_group')
            .populate({ path: 'doctor_id', populate: { path: 'userId', select: 'name' }, select: 'userId consultationFee' })
            .sort({ token_number: 1 });

        const waiting    = todayAppts.filter(a => a.status === 'Waiting').length;
        const inConsult  = todayAppts.filter(a => a.status === 'In-Consultation').length;
        const completed  = todayAppts.filter(a => ['Completed','completed'].includes(a.status)).length;
        const noShow     = todayAppts.filter(a => ['Cancelled','cancelled'].includes(a.status)).length;
        const pending    = todayAppts.filter(a => a.status === 'pending').length;
        const emergency  = todayAppts.filter(a => a.type === 'Emergency').length;

        const calcAge = (dob) => dob ? new Date().getFullYear() - new Date(dob).getFullYear() : null;

        res.json({
            total_today: todayAppts.length,
            waiting, in_consultation: inConsult, completed,
            no_show: noShow, pending, emergency,
            appointments: todayAppts.map(a => ({
                id: a._id,
                token_number: a.token_number,
                status: a.status,
                type: a.type,
                payment_status: a.payment_status,
                rejection_reason: a.rejection_reason || '',
                reason_for_visit: a.reason_for_visit,
                // Full patient details
                patient_name:   a.patient_id?.name   || 'Unknown',
                patient_email:  a.patient_id?.email  || '',
                patient_phone:  a.patient_id?.phone  || '',
                patient_gender: a.patient_id?.gender || '',
                patient_age:    calcAge(a.patient_id?.dob),
                patient_blood:  a.patient_id?.blood_group || '',
                patient_id:     a.patient_id?._id,
                doctor_name:    a.doctor_id?.userId?.name || 'Unknown',
                doctor_id:      a.doctor_id?._id,
                consultation_fee: a.doctor_id?.consultationFee || 300,
            }))
        });
    } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

// 3. Update status with rejection reason
router.post('/update_status', async (req, res) => {
    try {
        const { appointment_id, status, rejection_reason } = req.body;
        const update = { status };
        if (rejection_reason) update.rejection_reason = rejection_reason;
        if (status === 'Waiting') update.checked_in_at = new Date();
        if (status === 'confirmed') update.approved_at = new Date();
        await Appointment.findByIdAndUpdate(appointment_id, update);
        const io = req.app.get('io');
        if (io) io.to('clinic_queue').emit('appointment_updated', { appointment_id, status, rejection_reason });
        res.json({ message: `Appointment ${status}` });
    } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

// 4. Check-in
router.post('/checkin', async (req, res) => {
    try {
        const { appointment_id } = req.body;
        await Appointment.findByIdAndUpdate(appointment_id, { status: 'Waiting' });
        const io = req.app.get('io');
        if (io) io.to('clinic_queue').emit('queue_updated', { message: 'Patient checked in' });
        res.json({ message: 'Patient checked in' });
    } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

// 5. Payment
router.post('/payment', async (req, res) => {
    try {
        const { appointment_id, payment_status, payment_method, payment_amount } = req.body;
        await Appointment.findByIdAndUpdate(appointment_id, {
            payment_status,
            payment_method: payment_method || 'cash',
            payment_amount: payment_amount || 0,
            payment_date: new Date()
        });
        const io = req.app.get('io');
        if (io) io.to('clinic_queue').emit('appointment_updated', { appointment_id, payment_status });
        res.json({ message: `Payment of ₹${payment_amount} collected via ${payment_method}` });
    } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

// 6. Walk-in booking (create patient + appointment)
router.post('/walkin', async (req, res) => {
    try {
        const { name, email, phone, gender, dob, blood_group, doctor_id, reason_for_visit, type } = req.body;

        if (!name || !phone || !doctor_id || !reason_for_visit) {
            return res.status(400).json({ error: 'Required fields: name, phone, doctor_id, reason_for_visit' });
        }

        const emailCandidate = (email || '').trim().toLowerCase();
        const phoneCandidate = (phone || '').trim();

        let patient = null;
        if (emailCandidate) {
            patient = await User.findOne({ email: emailCandidate, role: 'patient' });
        }
        if (!patient && phoneCandidate) {
            patient = await User.findOne({ phone: phoneCandidate, role: 'patient' });
        }

        if (patient) {
            // Update existing patient details
            await User.findByIdAndUpdate(patient._id, {
                name, 
                email: emailCandidate || patient.email, 
                phone: phoneCandidate || patient.phone,
                gender: gender || patient.gender,
                dob: dob ? new Date(dob) : patient.dob,
                blood_group: blood_group || patient.blood_group,
                last_visit: new Date()
            }, { new: true, runValidators: true });
        } else {
            patient = await User.create({
                name,
                email: emailCandidate || `walkin_${Date.now()}@clinic.com`,
                password: bcrypt.hashSync('walkin123', 10),
                role: 'patient',
                phone: phoneCandidate,
                gender: gender || '',
                dob: dob ? new Date(dob) : null,
                blood_group: blood_group || '',
                last_visit: new Date()
            });
        }

        const today = new Date().toISOString().split('T')[0];
        const count = await Appointment.countDocuments({ doctor_id, date: today });
        const token_number = count + 1;

        const appt = await Appointment.create({
            patient_id: patient._id,
            doctor_id,
            date: today,
            token_number,
            reason_for_visit,
            type: type || 'Normal',
            status: 'Waiting'
        });

        const io = req.app.get('io');
        if (io) io.to('clinic_queue').emit('queue_updated', { message: 'Walk-in patient added' });

        res.json({
            message: 'Walk-in booked',
            token_number,
            appointment_id: appt._id,
            patient_id: patient._id,
            patient: {
                name: patient.name,
                email: patient.email,
                phone: patient.phone,
                gender: patient.gender,
                dob: patient.dob,
                blood_group: patient.blood_group
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Walk-in booking failed' });
    }
});

// 7. Search patients
router.get('/search-patients', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);
        const patients = await User.find({
            role: 'patient',
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
                { phone: { $regex: q, $options: 'i' } }
            ]
        }).select('name email phone').limit(10);
        res.json(patients);
    } catch (err) { res.status(500).json({ error: 'Search error' }); }
});

// 8. Patient full history (appointments + prescriptions)
router.get('/patient-history/:patient_id', async (req, res) => {
    try {
        const pid = req.params.patient_id;
        const Prescription = require('../models/Prescription');

        const [patient, appointments, prescriptions] = await Promise.all([
            User.findById(pid).select('name email phone gender dob blood_group'),
            Appointment.find({ patient_id: pid })
                .populate({ path: 'doctor_id', populate: { path: 'userId', select: 'name' } })
                .sort({ date: -1 }),
            Prescription.find({ patientId: pid })
                .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
                .sort({ createdAt: -1 })
        ]);

        res.json({
            patient: patient || {},
            appointments: appointments.map(a => ({
                id: a._id,
                date: a.date,
                status: a.status,
                type: a.type,
                reason_for_visit: a.reason_for_visit,
                doctor_name: a.doctor_id?.userId?.name || 'Unknown',
                token_number: a.token_number
            })),
            prescriptions: prescriptions.map(p => ({
                id: p._id,
                date: p.createdAt,
                diagnosis: p.diagnosis,
                medicines: p.medicines,
                notes: p.notes,
                doctor_name: p.doctorId?.userId?.name || 'Unknown'
            }))
        });
    } catch (err) { res.status(500).json({ error: 'History error' }); }
});

// 9. Doctor availability
router.get('/doctors', async (req, res) => {
    try {
        const doctors = await Doctor.find().populate('userId', 'name email');
        const today = new Date().toISOString().split('T')[0];
        const result = [];
        for (const d of doctors) {
            const count = await Appointment.countDocuments({ doctor_id: d._id, date: today, status: { $in: ['Waiting', 'In-Consultation', 'confirmed'] } });
            result.push({
                _id: d._id,
                name: d.userId?.name || 'Unknown',
                email: d.userId?.email || '',
                specialization: d.specialization,
                consultationFee: d.consultationFee,
                queue_count: count,
                status: count < 15 ? 'Available' : 'Busy'
            });
        }
        res.json(result);
    } catch (err) { res.status(500).json({ error: 'Doctor fetch error' }); }
});

// 10. Analytics
router.get('/analytics', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const last7 = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const count = await Appointment.countDocuments({ date: dateStr });
            last7.push({ date: dateStr, count });
        }
        const noShows = await Appointment.countDocuments({ date: today, status: { $in: ['Cancelled','cancelled'] } });
        const totalToday = await Appointment.countDocuments({ date: today });
        const paid = await Appointment.countDocuments({ payment_status: 'paid' });
        res.json({ last7Days: last7, no_shows_today: noShows, total_today: totalToday, total_paid: paid });
    } catch (err) { res.status(500).json({ error: 'Analytics error' }); }
});

module.exports = router;
