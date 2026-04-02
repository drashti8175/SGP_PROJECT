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
            { email: 'admin@clinic.com',      name: 'Admin',            role: 'admin' },
            { email: 'reception@clinic.com',  name: 'Receptionist',     role: 'receptionist' },
            { email: 'sushma@clinic.com',     name: 'Dr. Sushma Patel', role: 'doctor' },
            { email: 'hemant@clinic.com',     name: 'Dr. Hemant Shah',  role: 'doctor' },
            { email: 'sachet@gmail.com',      name: 'Sachet Kumar',     role: 'patient' },
            { email: 'john@example.com',      name: 'John Doe',         role: 'patient' },
        ];

        console.log('🌱 Seeding core users and doctor profiles...');
        for (const acc of accounts) {
            const exists = await User.findOne({ email: acc.email });
            if (!exists) {
                const user = await User.create({ name: acc.name, email: acc.email, password: hash, role: acc.role });
                if (acc.role === 'doctor') {
                    const spec = acc.email.includes('sushma') ? 'Cardiologist' : 'General Physician';
                    const fee  = acc.email.includes('sushma') ? 500 : 300;
                    await Doctor.create({ userId: user._id, specialization: spec, consultationFee: fee, experience: 10 });
                }
                console.log(`✅ Created: ${acc.email}`);
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