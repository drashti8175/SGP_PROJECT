const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patient_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    doctor_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Doctor', 
        required: true 
    },
    date: { 
        type: String, // YYYY-MM-DD
        required: true 
    },
    token_number: {
        type: Number,
        required: true
    },
    queue_position: {
        type: Number
    },
    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'Waiting', 'In-Consultation', 'Completed', 'Cancelled', 'Emergency', 'completed', 'cancelled'], 
        default: 'Waiting' 
    },
    type: { 
        type: String, 
        enum: ['Normal', 'Emergency'], 
        default: 'Normal' 
    },
    reason_for_visit: {
        type: String,
        required: true
    },
    vitals: {
        bp: { type: String, default: '120/80' },
        temp: { type: String, default: '98.6' },
        weight: { type: String, default: '70' }
    },
    risk_level: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    consultation_start: Date,
    consultation_end: Date
}, { 
    timestamps: true 
});

// Indexes to speed up queries for daily schedules
appointmentSchema.index({ doctor_id: 1, date: 1 });
appointmentSchema.index({ patient_id: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
