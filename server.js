require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const connectDB = require('./database/db');
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Serve module frontends
app.use('/doctor-app', express.static('CareConnect_Doctor/frontend'));
app.use('/patient-app', express.static('CareConnect_Patient/frontend'));

// API Routes
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const receptionistRoutes = require('./routes/receptionistRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctor', doctorRoutes);
app.get('/doctors', (req, res) => res.redirect('/api/doctor')); // Alias for user convenience
app.use('/api/receptionist', receptionistRoutes);
app.use('/api/admin', adminRoutes);

// Basic health check route
app.get('/api/ping', (req, res) => res.json({ message: 'pong' }));

// Set up Socket.IO for real-time queue updates
io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);
    
    socket.on('join_queue', (data) => {
        // Patients and doctors join a specific room or listen to global events
        socket.join('clinic_queue');
        console.log(`User ${socket.id} joined the clinic queue.`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// We attach io to the app so that routes can access it to emit events
app.set('io', io);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
