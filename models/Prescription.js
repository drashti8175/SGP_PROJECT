const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',        // ✅ fixed from 'Patient' to 'User'
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
        // ✅ removed unique:true so doctor can update/re-save prescription
    },
    diagnosis: {
        type: String,
        required: true
    },
    medicines: [{
        name:     { type: String, required: true },
        dosage:   { type: String, required: true },
        duration: { type: String, required: true }
    }],
    notes: { type: String, default: '' }
}, {
    timestamps: true
});

prescriptionSchema.index({ patientId: 1 });
prescriptionSchema.index({ doctorId: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
