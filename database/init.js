const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const dbDir = path.resolve(__dirname);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.resolve(__dirname, 'clinic.db');
const db = new sqlite3.Database(dbPath);

console.log("Initializing database...");

db.serialize(() => {
    // 1. Users Table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('patient', 'doctor', 'receptionist', 'admin')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 2. Doctors Table
    db.run(`
        CREATE TABLE IF NOT EXISTS doctors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            specialty TEXT NOT NULL,
            working_days TEXT DEFAULT 'Monday to Friday',
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // 3. Appointments Table
    db.run(`
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            doctor_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            time_slot TEXT NOT NULL,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'completed', 'cancelled', 'in-consultation')),
            payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid')),
            qr_code TEXT,
            FOREIGN KEY(patient_id) REFERENCES users(id),
            FOREIGN KEY(doctor_id) REFERENCES doctors(id)
        )
    `);

    // 4. Prescriptions Table
    db.run(`
        CREATE TABLE IF NOT EXISTS prescriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            appointment_id INTEGER NOT NULL UNIQUE,
            details TEXT NOT NULL,
            file_content TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(appointment_id) REFERENCES appointments(id)
        )
    `);

    // 5. Seed default admin, receptionist, and doctor
    console.log("Seeding default accounts...");
    
    // Seed Admin
    const defaultPassword = bcrypt.hashSync("admin123", 10);
    db.get('SELECT id FROM users WHERE email = ?', ['admin@clinic.com'], (err, row) => {
        if (!row) {
            db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                ['Master Admin', 'admin@clinic.com', defaultPassword, 'admin'], 
                function(err) {
                    if (err) console.error("Error seeding admin:", err);
                    else console.log("Seeded Admin (admin@clinic.com / admin123)");
                });
        }
    });

    // Seed Receptionist
    const rcptPassword = bcrypt.hashSync("receptionist123", 10);
    db.get('SELECT id FROM users WHERE email = ?', ['receptionist@clinic.com'], (err, row) => {
        if (!row) {
            db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                ['Front Desk', 'receptionist@clinic.com', rcptPassword, 'receptionist'],
                function(err) {
                    if (err) console.error("Error seeding receptionist:", err);
                    else console.log("Seeded Receptionist (receptionist@clinic.com / receptionist123)");
                });
        }
    });

    // Seed Doctor
    const docPassword = bcrypt.hashSync("doctor123", 10);
    db.get('SELECT id FROM users WHERE email = ?', ['doctor@clinic.com'], (err, row) => {
        if (!row) {
            db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                ['Dr. Smith', 'doctor@clinic.com', docPassword, 'doctor'], function(err) {
                    if (err) {
                        console.error("Error seeding doctor user:", err);
                    } else {
                        console.log("Seeded Doctor User (doctor@clinic.com / doctor123)");
                        db.run('INSERT INTO doctors (user_id, specialty) VALUES (?, ?)',
                            [this.lastID, 'General Physician'], function(err) {
                                if (err) console.error("Error seeding doctor details:", err);
                                else console.log("Seeded Doctor Details");
                            });
                    }
                });
        }
    });
});

// Wait a bit before closing to ensure async inserts finish (dirty but works for a simple seed script)
setTimeout(() => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed.');
    });
}, 2000);
