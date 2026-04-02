const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("🚀 [DATABASE] Connected to MongoDB Atlas");
    } catch (err) {
        console.error("❌ [DATABASE] Connection Error:", err.message);
        process.exit(1); // Stop the server if DB connection fails
    }
};

module.exports = connectDB;