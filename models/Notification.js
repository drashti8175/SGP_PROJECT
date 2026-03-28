const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
    doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    message: String,
    type: { type: String, enum: ['info', 'warning', 'emergency'], default: 'info' },
    is_read: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Notification', notificationSchema);
