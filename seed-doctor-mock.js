require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // 1. Create Demo Doctor User
        const passwordHash = await bcrypt.hash('password123', 10);
        let userDoc = await User.findOne({ email: 'doctor@demo.com' });
        if (!userDoc) {
            userDoc = await User.create({
                name: 'Dr. Rashmi',
                email: 'doctor@demo.com',
                password: passwordHash,
                role: 'doctor',
                phone: '9876543210'
            });
            console.log("Created demo Doctor User.");
        } else {
            // reset password
            userDoc.password = passwordHash;
            await userDoc.save();
            console.log("Updated demo Doctor User.");
        }

        // 2. Create Doctor Profile
        let docProfile = await Doctor.findOne({ userId: userDoc._id });
        if (!docProfile) {
            docProfile = await Doctor.create({
                userId: userDoc._id,
                specialization: 'Cardiology',
                consultationFee: 1000
            });
            console.log("Created demo Doctor Profile.");
        }

        // 3. Create a Demo Patient User
        let userPat1 = await User.findOne({ email: 'patient1@demo.com' });
        if (!userPat1) {
            userPat1 = await User.create({
                name: 'Amitabh Bachchan',
                email: 'patient1@demo.com',
                password: passwordHash,
                role: 'patient',
                gender: 'Male',
                dob: new Date('1942-10-11'),
            });
            console.log("Created demo Patient 1 User.");
        }
        
        // 4. Create Patient 2 User
        let userPat2 = await User.findOne({ email: 'patient2@demo.com' });
        if (!userPat2) {
            userPat2 = await User.create({
                name: 'Deepika Padukone',
                email: 'patient2@demo.com',
                password: passwordHash,
                role: 'patient',
                gender: 'Female',
                dob: new Date('1986-01-05'),
            });
            console.log("Created demo Patient 2 User.");
        }
        
        // Add Patient models for them (optional but good)
        let patProfile1 = await Patient.findOne({ userId: userPat1._id });
        if(!patProfile1) await Patient.create({ userId: userPat1._id, age: 82, gender: 'Male', medicalHistory: ['Hypertension'], allergies: ['Penicillin'] });
        
        let patProfile2 = await Patient.findOne({ userId: userPat2._id });
        if(!patProfile2) await Patient.create({ userId: userPat2._id, age: 38, gender: 'Female', allergies: ['None'] });

        // 5. Create Appointments for Today
        const todayStr = new Date().toISOString().split('T')[0];
        
        // Clear today's mock appointments if they exist to prevent dupes
        await Appointment.deleteMany({ doctor_id: docProfile._id, date: todayStr });
        
        await Appointment.create([
            {
                patient_id: userPat1._id,
                doctor_id: docProfile._id,
                date: todayStr,
                token_number: 101,
                status: 'Waiting',
                type: 'Emergency',
                reason_for_visit: 'Severe Chest Pain',
                risk_level: 'High'
            },
            {
                patient_id: userPat2._id,
                doctor_id: docProfile._id,
                date: todayStr,
                token_number: 102,
                status: 'Waiting',
                type: 'Normal',
                reason_for_visit: 'Routine Checkup',
                risk_level: 'Low'
            }
        ]);
        console.log("Created dummy Appointments for today.");
        
        console.log("Database Mock Seeding Complete!");
        process.exit(0);

    } catch (err) {
        console.error("Seeding Error:", err);
        process.exit(1);
    }
};

seedDB();
