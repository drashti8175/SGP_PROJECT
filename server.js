require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
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

// API Routes
app.use('/api/auth',         require('./routes/authRoutes'));
app.use('/api/patient',      require('./routes/patientRoutes'));
app.use('/api/doctor',       require('./routes/doctorRoutes'));
app.use('/api/receptionist', require('./routes/receptionistRoutes'));
app.use('/api/admin',        require('./routes/adminRoutes'));

// Health check
app.get('/api/ping', (req, res) => res.json({ status: 'ok', db: require('mongoose').connection.readyState === 1 ? 'Atlas' : 'Memory' }));

// Socket.IO
io.on('connection', (socket) => {
    socket.on('join_queue', () => socket.join('clinic_queue'));
    socket.on('disconnect', () => {});
});
app.set('io', io);

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/dist')));
    app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'client/dist/index.html')));
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
