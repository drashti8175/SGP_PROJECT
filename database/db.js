const mongoose = require('mongoose');

const seedUsers = async () => {
    try {
        const User = require('../models/User');
        const Doctor = require('../models/Doctor');
        const bcrypt = require('bcryptjs');

        const hash = bcrypt.hashSync('1234', 10);

        const doctorEmails = ['sushma@clinic.com', 'hemant@clinic.com'];

        for (const email of doctorEmails) {
            let user = await User.findOne({ email });

            if (!user) {
                console.log(`📦 Creating Doctor: ${email}`);

                const name = email.includes('sushma') ? 'Dr. Sushma' : 'Dr. Hemant';

                const newUser = await User.create({
                    name,
                    email,
                    password: hash,
                    role: 'doctor'
                });

                const spec = email.includes('sushma')
                    ? 'Cardiologist'
                    : 'General Physician';

                const fee = email.includes('sushma') ? 500 : 300;

                await Doctor.create({
                    userId: newUser._id,
                    specialization: spec,
                    consultationFee: fee
                });
            }
        }

        // Admin
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            await User.create({
                name: 'Admin',
                email: 'admin@clinic.com',
                password: hash,
                role: 'admin'
            });
        }

        // Receptionist
        const recExists = await User.findOne({ role: 'receptionist' });
        if (!recExists) {
            await User.create({
                name: 'Receptionist',
                email: 'reception@clinic.com',
                password: hash,
                role: 'receptionist'
            });
        }

        const count = await Doctor.countDocuments();
        console.log(`✅ Seeding complete. Total Doctors: ${count}`);

        // Seed Sample Appointments for Queue Demo
        const Appointment = require('../models/Appointment');
        const apptCount = await Appointment.countDocuments();
        if (apptCount === 0) {
            const sachet = await User.findOne({ email: 'sachet@gmail.com' });
            const sushma = await User.findOne({ email: 'sushma@clinic.com' });
            const sushmaDoc = await Doctor.findOne({ userId: sushma?._id });

            if (sachet && sushmaDoc) {
                const today = new Date().toISOString().split('T')[0];
                await Appointment.create([
                    {
                        patient_id: sachet._id,
                        doctor_id: sushmaDoc._id,
                        date: today,
                        token_number: 1,
                        reason_for_visit: 'Regular checkup',
                        type: 'Normal',
                        status: 'In-Consultation'
                    },
                    {
                        patient_id: sachet._id, // Using same patient for demo simplicity
                        doctor_id: sushmaDoc._id,
                        date: today,
                        token_number: 2,
                        reason_for_visit: 'Chest pain',
                        type: 'Emergency',
                        status: 'Waiting'
                    }
                ]);
                console.log("📝 Sample appointments seeded.");
            }
        }

    } catch (err) {
        console.error("❌ Seeding Error:", err.message);
    }
};


const connectDB = async () => {
    try {
        console.log("📡 Connecting to MongoDB...");

        await mongoose.connect(process.env.MONGO_URI);

        console.log("✅ MongoDB Connected Successfully");

        // Run seeding AFTER connection
        await seedUsers();

    } catch (error) {
        console.error("❌ MongoDB Connection Failed:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
