const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');

const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');

const app = express();
app.use(express.json());
app.use(cors());

// --- SEEDING LOGIC ---
const seedDoctors = async () => {
    const doctors = [
        { name: 'Dr. Sushma', specialization: 'Cardiologist', username: 'sushma', password: '1234' },
        { name: 'Dr. Hemant', specialization: 'General Physician', username: 'hemant', password: '1234' }
    ];

    for (const doc of doctors) {
        await Doctor.findOneAndUpdate({ username: doc.username }, doc, { upsert: true, new: true });
    }
    console.log("✅ Doctors seeded successfully!");
};

// --- DOCTOR LOGIN ---
app.post('/api/doctor/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const doctor = await Doctor.findOne({ username, password });
        if (!doctor) return res.status(401).json({ error: "Invalid username or password" });
        res.json({ message: "Login successful", doctorId: doctor._id, name: doctor.name });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- PATIENT BOOKING ---
app.post('/api/patient/book', async (req, res) => {
    const { name, email, phone, doctorId, date } = req.body;
    try {
        // Find or create patient
        let patient = await Patient.findOne({ email });
        if (!patient) patient = await Patient.create({ name, email, phone });

        // Calculate token (unique per doctor per day)
        const lastAppt = await Appointment.findOne({ doctor_id: doctorId, date }).sort({ token_number: -1 });
        const newToken = lastAppt ? lastAppt.token_number + 1 : 1;

        const appointment = await Appointment.create({
            patient_id: patient._id,
            doctor_id: doctorId,
            date,
            token_number: newToken
        });

        res.json({ message: "Appointment booked!", token: newToken, patientName: name });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- DOCTOR SPECIFIC APIs ---
app.get('/api/doctor/appointments/:doctorId', async (req, res) => {
    try {
        const appointments = await Appointment.find({ doctor_id: req.params.doctorId })
            .populate('patient_id')
            .sort({ date: 1, token_number: 1 });
        res.json(appointments);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/doctor/queue/:doctorId', async (req, res) => {
    const today = new Date().toISOString().split('T')[0]; // Simple YYYY-MM-DD
    try {
        const queue = await Appointment.find({ doctor_id: req.params.doctorId, date: today })
            .populate('patient_id')
            .sort({ token_number: 1 });
        res.json(queue);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/doctor/stats/:doctorId', async (req, res) => {
    try {
        const total = await Appointment.countDocuments({ doctor_id: req.params.doctorId });
        const waiting = await Appointment.countDocuments({ doctor_id: req.params.doctorId, status: 'scheduled' });
        res.json({ total_appointments: total, patients_waiting: waiting });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/doctors', async (req, res) => {
    try {
        const doctors = await Doctor.find({}, 'name specialization');
        res.json(doctors);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- SERVER STARTUP ---
const startServer = async () => {
    try {
        const mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());
        console.log("✅ Connected to In-Memory MongoDB!");

        await seedDoctors();

        const PORT = 5000;
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    } catch (err) { console.error(err); }
};

startServer();
