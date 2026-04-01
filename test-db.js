require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
    try {
        console.log("Testing MongoDB Connection...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connection SUCCESSFUL!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Connection FAILED:", err.message);
        process.exit(1);
    }
};

testConnection();
