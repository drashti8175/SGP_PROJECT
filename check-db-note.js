const mongoose = require('mongoose');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');

const checkDB = async () => {
    try {
        // We can't connect to the SAME memory server from a different process easily
        // unless we know the URI. 
        // But the server.js is running in a different process.
        // So this script won't see the SAME data.
        console.log("Note: This script cannot see the in-memory data of the running server.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDB();
