require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const connectDB = require('./db');

const seedDB = async () => {
    try {
        await connectDB();
        
        console.log("Seeding default accounts to MongoDB...");

        // Admin
        const adminExt = await User.findOne({ email: 'admin@clinic.com' });
        if (!adminExt) {
            const defaultPassword = bcrypt.hashSync("admin123", 10);
            await User.create({
                name: 'Master Admin',
                email: 'admin@clinic.com',
                password: defaultPassword,
                role: 'admin'
            });
            console.log("Seeded Admin (admin@clinic.com / admin123)");
        }

        // Receptionist
        const rcptExt = await User.findOne({ email: 'receptionist@clinic.com' });
        if (!rcptExt) {
            const rcptPassword = bcrypt.hashSync("receptionist123", 10);
            await User.create({
                name: 'Front Desk',
                email: 'receptionist@clinic.com',
                password: rcptPassword,
                role: 'receptionist'
            });
            console.log("Seeded Receptionist (receptionist@clinic.com / receptionist123)");
        }

        // Doctor
        const docExt = await User.findOne({ email: 'doctor@clinic.com' });
        if (!docExt) {
            const docPassword = bcrypt.hashSync("doctor123", 10);
            const docUser = await User.create({
                name: 'Dr. Smith',
                email: 'doctor@clinic.com',
                password: docPassword,
                role: 'doctor'
            });
            console.log("Seeded Doctor User (doctor@clinic.com / doctor123)");
            
            await Doctor.create({
                userId: docUser._id,
                specialization: 'General Physician',
                consultationFee: 500
            });
            console.log("Seeded Doctor Details");
        }

        console.log("Seeding complete. Exiting...");
        process.exit(0);
    } catch (err) {
        console.error("Error seeding DB:", err);
        process.exit(1);
    }
};

seedDB();
