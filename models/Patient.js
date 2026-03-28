const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true
    },
    age: { 
        type: Number,
        min: 0,
        max: 150
    },
    gender: { 
        type: String,
        enum: ['Male', 'Female', 'Other']
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    address: {
        type: String,
        trim: true
    },
    medicalHistory: [{
        type: String
    }],
    reports: [{
        type: String // URLs to file storage
    }],
    allergies: [{
        type: String
    }]
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Patient', patientSchema);
