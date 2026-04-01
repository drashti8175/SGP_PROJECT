const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Name is required'],
        trim: true
    },
    email: { 
        type: String, 
        unique: true,
        sparse: true, // sparse allows null/missing while keeping uniqueness
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
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
    }
}, { 
    timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for frequent queries
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
