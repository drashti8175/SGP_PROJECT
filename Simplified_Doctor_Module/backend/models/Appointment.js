const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: String, required: true }, // Format YYYY-MM-DD for simple grouping
    token_number: { type: Number, required: true },
    status: { type: String, enum: ['scheduled', 'in-consultation', 'completed', 'cancelled'], default: 'scheduled' }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
