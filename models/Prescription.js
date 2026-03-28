const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    patientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Patient', 
        required: true 
    },
    doctorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Doctor', 
        required: true 
    },
    appointmentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Appointment', 
        required: true,
        unique: true
    },
    diagnosis: {
        type: String,
        required: true
    },
    medicines: [{
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        duration: { type: String, required: true }
    }],
    notes: {
        type: String
    }
}, { 
    timestamps: true 
});

// Index for fetching prescriptions by patient rapidly
prescriptionSchema.index({ patientId: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
