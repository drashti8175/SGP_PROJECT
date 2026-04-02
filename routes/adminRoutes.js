const express = require('express');
const router = express.Router();
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

router.use(verifyToken);
router.use(verifyRole(['admin']));

// 1. Full dashboard stats
router.get('/stats', async (req, res) => {
    try {
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // ISO week starts Monday
        const dayOfWeek = now.getDay(); // 0=Sunday,1=Monday
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStartDate = new Date(now);
        weekStartDate.setHours(0, 0, 0, 0);
        weekStartDate.setDate(now.getDate() + mondayOffset);
        const weekStart = weekStartDate.toISOString().split('T')[0];

        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);
        const weekEnd = weekEndDate.toISOString().split('T')[0];

        const [total_today, total_week, pending, waiting, completed, no_show,
               total_doctors, total_patients, total_staff, paid_count, emergency] = await Promise.all([
            Appointment.countDocuments({ date: today, status: { $nin: ['Cancelled','cancelled'] } }),
            Appointment.countDocuments({ date: { $gte: weekStart, $lte: weekEnd }, status: { $nin: ['Cancelled','cancelled'] } }),
            Appointment.countDocuments({ status: 'confirmed' }),
            Appointment.countDocuments({ date: today, status: 'Waiting' }),
            Appointment.countDocuments({ status: { $in: ['Completed','completed'] } }),
            Appointment.countDocuments({ date: today, status: { $in: ['Cancelled','cancelled'] } }),
            Doctor.countDocuments({}),
            User.countDocuments({ role: 'patient' }),
            User.countDocuments({ role: { $in: ['receptionist','doctor'] } }),
            Appointment.countDocuments({ payment_status: 'paid' }),
            Appointment.countDocuments({ date: today, type: 'Emergency' }),
        ]);

        // Last 7 days chart data
        const last7 = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const ds = d.toISOString().split('T')[0];
            const count = await Appointment.countDocuments({ date: ds });
            last7.push({ date: ds, day: d.toLocaleDateString('en-IN', { weekday: 'short' }), count });
        }

        res.json({
            total_today, total_week, pending, waiting, completed,
            no_show, total_doctors, total_patients, total_staff,
            total_revenue: paid_count * 50, emergency, last7
        });
    } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

// 2. All appointments with filters
router.get('/appointments', async (req, res) => {
    try {
        const { status, date, doctor_id } = req.query;
        const filter = {};
        if (status && status !== 'all') filter.status = status;
        if (date) filter.date = date;
        if (doctor_id) filter.doctor_id = doctor_id;

        const appts = await Appointment.find(filter)
            .populate('patient_id', 'name email phone')
            .populate({ path: 'doctor_id', populate: { path: 'userId', select: 'name' } })
            .sort({ date: -1, token_number: 1 })
            .limit(200);

        res.json(appts.map(a => ({
            id: a._id, date: a.date, token_number: a.token_number,
            status: a.status, type: a.type, payment_status: a.payment_status,
            reason_for_visit: a.reason_for_visit, risk_level: a.risk_level,
            patient_name: a.patient_id?.name || 'Unknown',
            patient_email: a.patient_id?.email || '',
            patient_phone: a.patient_id?.phone || '',
            patient_id: a.patient_id?._id,
            doctor_name: a.doctor_id?.userId?.name || 'Unknown',
            doctor_id: a.doctor_id?._id,
        })));
    } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

// 3. Update appointment status
router.post('/appointments/update', async (req, res) => {
    try {
        const { appointment_id, status } = req.body;
        await Appointment.findByIdAndUpdate(appointment_id, { status });
        const io = req.app.get('io');
        if (io) io.to('clinic_queue').emit('appointment_updated', { appointment_id, status });
        res.json({ message: 'Updated' });
    } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

// 4. Batch approve
router.post('/appointments/batch-approve', async (req, res) => {
    try {
        const { ids } = req.body;
        await Appointment.updateMany({ _id: { $in: ids } }, { status: 'confirmed' });
        const io = req.app.get('io');
        if (io) io.to('clinic_queue').emit('queue_updated', { message: 'Batch approved' });
        res.json({ message: `${ids.length} appointments approved` });
    } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

// 5. All users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

// 6. Update user role
router.post('/users/update-role', async (req, res) => {
    try {
        const { user_id, role } = req.body;
        await User.findByIdAndUpdate(user_id, { role });
        res.json({ message: 'Role updated' });
    } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

// 7. Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

// 8. All doctors with stats
router.get('/doctors', async (req, res) => {
    try {
        const doctors = await Doctor.find().populate('userId', 'name email');
        const today = new Date().toISOString().split('T')[0];
        const result = [];
        for (const d of doctors) {
            const [today_count, total_count] = await Promise.all([
                Appointment.countDocuments({ doctor_id: d._id, date: today }),
                Appointment.countDocuments({ doctor_id: d._id, status: { $in: ['Completed','completed'] } }),
            ]);
            result.push({
                doctor_id: d._id, name: d.userId?.name || 'Unknown',
                email: d.userId?.email || '', user_id: d.userId?._id,
                specialization: d.specialization, consultationFee: d.consultationFee,
                experience: d.experience, rating: d.rating,
                today_patients: today_count, total_patients: total_count,
                availability: d.availability,
            });
        }
        res.json(result);
    } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

// 9. Add doctor
router.post('/doctors/add', async (req, res) => {
    try {
        const { name, email, password, specialization, consultationFee, experience } = req.body;
        if (!name || !email || !specialization) return res.status(400).json({ error: 'Missing fields' });

        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({
                name, email,
                password: bcrypt.hashSync(password || '1234', 10),
                role: 'doctor'
            });
        }
        const doc = await Doctor.create({
            userId: user._id, specialization,
            consultationFee: consultationFee || 300,
            experience: experience || 0,
        });
        res.json({ message: 'Doctor added', doctor_id: doc._id });
    } catch (err) { res.status(500).json({ error: 'Failed to add doctor' }); }
});

// 10. Update doctor
router.post('/doctors/update', async (req, res) => {
    try {
        const { doctor_id, specialization, consultationFee, experience } = req.body;
        await Doctor.findByIdAndUpdate(doctor_id, { specialization, consultationFee, experience });
        res.json({ message: 'Doctor updated' });
    } catch (err) { res.status(500).json({ error: 'Update failed' }); }
});

// 11. Delete doctor
router.delete('/doctors/:id', async (req, res) => {
    try {
        const doc = await Doctor.findByIdAndDelete(req.params.id);
        if (doc) await User.findByIdAndUpdate(doc.userId, { role: 'patient' });
        res.json({ message: 'Doctor removed' });
    } catch (err) { res.status(500).json({ error: 'Delete failed' }); }
});

// 12. Analytics
router.get('/analytics', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const last30 = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const ds = d.toISOString().split('T')[0];
            const [total, noshow, paid] = await Promise.all([
                Appointment.countDocuments({ date: ds }),
                Appointment.countDocuments({ date: ds, status: { $in: ['Cancelled','cancelled'] } }),
                Appointment.countDocuments({ date: ds, payment_status: 'paid' }),
            ]);
            last30.push({ date: ds, total, noshow, paid });
        }

        // Doctor-wise load
        const doctors = await Doctor.find().populate('userId', 'name');
        const doctorLoad = [];
        for (const d of doctors) {
            const count = await Appointment.countDocuments({ doctor_id: d._id, status: { $in: ['Completed','completed'] } });
            doctorLoad.push({ name: d.userId?.name || 'Unknown', count });
        }

        res.json({ last30, doctorLoad });
    } catch (err) { res.status(500).json({ error: 'Analytics error' }); }
});

module.exports = router;
