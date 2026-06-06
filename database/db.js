const mongoose = require('mongoose');

let seeded = false;

const seedDatabase = async () => {
    if (seeded) return;
    try {
        const User = require('../models/User');
        const Doctor = require('../models/Doctor');
        const Appointment = require('../models/Appointment');
        const Prescription = require('../models/Prescription');
        const bcrypt = require('bcryptjs');

        // Clear existing data for a clean start (Optional - remove in production)
        // await User.deleteMany({});
        // await Doctor.deleteMany({});

        const hash = bcrypt.hashSync('1234', 10);

        const accounts = [
            { email: 'admin@gmail.com',       username: 'admin',       name: 'Admin',            role: 'admin',         password: bcrypt.hashSync('Admin@123', 10) },
            { email: 'reception@gmail.com',   username: 'receptionist', name: 'Receptionist',    role: 'receptionist',  password: bcrypt.hashSync('Recep@123', 10) },
            { email: 'sushmapatel@gmail.com', username: 'drsushma',    name: 'Dr. Sushma Patel', role: 'doctor',        password: bcrypt.hashSync('Doctor@123', 10) },
            { email: 'hemantt@gmail.com',     username: 'drhemant',    name: 'Dr. Hemant Shah',  role: 'doctor',        password: bcrypt.hashSync('Doctor@123', 10) },
            { email: 'sachet@gmail.com',      username: 'sachet',      name: 'Sachet Kumar',     role: 'patient',       password: bcrypt.hashSync('Patient@123', 10) },
            { email: 'john.doe@gmail.com',    username: 'johndoe',     name: 'John Doe',         role: 'patient',       password: bcrypt.hashSync('Patient@123', 10) },
        ];

        console.log('🌱 Seeding core users and doctor profiles...');
        for (const acc of accounts) {
            const exists = await User.findOne({ $or: [{ email: acc.email }, { username: acc.username }] });
            const user = exists || await User.create({ name: acc.name, email: acc.email, username: acc.username, password: acc.password, role: acc.role });
            if (!exists) console.log(`✅ Created: ${acc.username} (${acc.role})`);
            // Update username if missing on existing user
            if (exists && !exists.username) {
                await User.findByIdAndUpdate(exists._id, { username: acc.username, password: acc.password });
                console.log(`✅ Updated username for: ${acc.email}`);
            }
            if (acc.role === 'doctor') {
                const spec = acc.email.includes('sushma') ? 'Cardiologist' : 'General Physician';  
                const fee  = acc.email.includes('sushma') ? 500 : 300;
                const docExists = await Doctor.findOne({ userId: user._id });
                if (!docExists) {
                    await Doctor.create({ userId: user._id, specialization: spec, consultationFee: fee, experience: 10 });
                    console.log(`✅ Doctor profile created for: ${acc.email}`);
                }
            }
        }

        // Seed some sample appointments and history if empty
        const apptCount = await Appointment.countDocuments();
        if (apptCount === 0) {
            console.log('📅 Seeding sample appointments...');
            const patient = await User.findOne({ role: 'patient' });
            const doctor = await Doctor.findOne();
            const today = new Date().toISOString().split('T')[0];

            if (patient && doctor) {
                const appt = await Appointment.create({
                    patient_id: patient._id,
                    doctor_id: doctor._id,
                    date: today,
                    token_number: 1,
                    reason_for_visit: 'Regular Checkup and Fever',
                    status: 'Completed',
                    type: 'Normal',
                    payment_status: 'paid'
                });

                await Prescription.create({
                    patientId: patient._id,
                    doctorId: doctor._id,
                    appointmentId: appt._id,
                    diagnosis: 'Viral Fever',
                    medicines: [
                        { name: 'Paracetamol', dosage: '500mg', frequency: '1-0-1', duration: '3 days' },
                        { name: 'Vitamin C', dosage: '1000mg', frequency: '0-1-0', duration: '5 days' }
                    ],
                    notes: 'Drink plenty of water and rest.'
                });
                console.log('✅ Sample medical records created');
            }
        }

        seeded = true;
        const usersTotal = await User.countDocuments();
        console.log(`✅ Database Structure Verified — ${usersTotal} users present.`);
    } catch (err) {
        console.error('❌ Seeding Error:', err.message);
    }
};

const connectDB = async () => {
  console.log("📡 Connecting to MongoDB Atlas...");
  
  mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
      console.log("✅ MongoDB Connected");
      // Run the seeder to ensure demo accounts exist
      await seedDatabase();
    })
    .catch(err => {
      console.log("❌ Mongo Error:", err.message);
      process.exit(1);
    });
};

module.exports = connectDB;