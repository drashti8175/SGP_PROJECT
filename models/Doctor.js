const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true
    },
    specialization: { 
        type: String, 
        required: true 
    },
    experience: { 
        type: Number, // Years of experience
        min: 0,
        default: 0
    },
    consultationFee: {
        type: Number,
        min: 0,
        required: true
    },
    availability: {
        days: [{
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        }],
        timeSlots: [{
            type: String // e.g., "09:00 AM - 10:00 AM"
        }]
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    }
}, { 
    timestamps: true 
});

// Index for frequently queried fields
doctorSchema.index({ specialization: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
