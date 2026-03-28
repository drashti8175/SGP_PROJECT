const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    currentTokenNumber: {
        type: Number,
        default: 0
    },
    patients: [{
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            required: true
        },
        tokenNumber: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ['waiting', 'in-progress', 'completed', 'skipped'],
            default: 'waiting'
        }
    }]
}, {
    timestamps: true 
});

// Compound index to quickly find today's queue for a doctor
queueSchema.index({ doctorId: 1, date: 1 });

module.exports = mongoose.model('Queue', queueSchema);
