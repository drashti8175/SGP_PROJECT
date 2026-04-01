const mongoose = require('mongoose');

const uri = 'mongodb+srv://nishthapatel074_db_user:Clinic%40@clinic.lpuaqaq.mongodb.net/clinicDB?retryWrites=true&w=majority';

const testConnection = async () => {
    try {
        console.log("Testing Hardcoded MongoDB Connection...");
        await mongoose.connect(uri);
        console.log("✅ Connection SUCCESSFUL!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Connection FAILED:", err.message);
        process.exit(1);
    }
};

testConnection();
