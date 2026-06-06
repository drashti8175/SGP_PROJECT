const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Name is required'],
        trim: true
    },
    username: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true
    },
    email: { 
        type: String, 
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true
    },
    password: { 
        type: String, 
        required: [true, 'Password is required'],
        minlength: 4
    },
    role: { 
        type: String, 
        enum: ['patient', 'doctor', 'receptionist', 'admin'], 
        default: 'patient' 
    },
    phone: String,
    gender: String,
    dob: Date,
    blood_group: String,
    last_visit: Date,
    profileImage: {
        type: String,
        default: ''
    },
    resetPasswordToken: { type: String, default: undefined },
    resetPasswordExpires: { type: Date, default: undefined },
    isActive: { type: Boolean, default: true }
}, { 
    timestamps: true
});

// Index for frequent queries
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
