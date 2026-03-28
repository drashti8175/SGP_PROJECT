const mongoose = require('mongoose');

const adminReportSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true // Usually one report generated per date
    },
    totalPatients: {
        type: Number,
        default: 0
    },
    totalRevenue: {
        type: Number,
        default: 0
    },
    averageConsultationTime: {
        type: Number, // Measured in minutes
        default: 0
    },
    totalAppointments: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true 
});

// Index to quickly pull reports over a date range
adminReportSchema.index({ date: -1 });

module.exports = mongoose.model('AdminReport', adminReportSchema);
