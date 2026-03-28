const mongoose = require('mongoose');
const historySchema = new mongoose.Schema({
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    diagnosis: String,
    medicines: [{
        name: String,
        dosage: String,
        duration: String
    }],
    notes: String,
    date: { type: Date, default: Date.now },
    report_url: String 
}, { timestamps: true });
module.exports = mongoose.model('History', historySchema);
