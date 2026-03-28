const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true,
        unique: true
    },
    qrVerified: {
        type: Boolean,
        default: false
    },
    checkInTime: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending', 'checked-in', 'no-show'],
        default: 'pending'
    }
}, {
    timestamps: true 
});

module.exports = mongoose.model('CheckIn', checkInSchema);
