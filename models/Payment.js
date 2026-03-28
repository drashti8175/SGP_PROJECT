const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        enum: ['UPI', 'card', 'cash'],
        required: true
    },
    status: {
        type: String,
        enum: ['paid', 'pending', 'failed'],
        default: 'pending'
    },
    transactionId: {
        type: String
    }
}, {
    timestamps: true 
});

// Index to find payments
paymentSchema.index({ patientId: 1 });
paymentSchema.index({ appointmentId: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);
