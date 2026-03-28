# MediCore - Full-Stack Clinic Management System

A simple, clean, and real-world functional clinic management dashboard using Node.js, Express, SQLite, and vanilla HTML/CSS.

## Folder Structure

```
FinalClinicManagement/
├── database/
│   ├── init.js           # SQLite database initialization script
│   └── clinic.db         # Data persistence file
├── middleware/
│   └── authMiddleware.js # JWT and Role-based access control
├── public/               # Frontend assets
│   ├── css/
│   │   └── style.css     # Clean, modern, glassmorphic UI styles
│   ├── js/
│   │   └── app.js        # Frontend routing and Socket.IO logic
│   └── index.html        # Main Single Page Application structure
├── routes/               # Modular Express API endpoints 
│   ├── adminRoutes.js    
│   ├── authRoutes.js     
│   ├── doctorRoutes.js   
│   ├── patientRoutes.js  
│   └── receptionistRoutes.js 
├── server.js             # Main Express Entrypoint integrating Socket.IO
├── package.json          # Node dependencies
└── README.md             # This file!
```

## How to Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) v14+ installed on your machine.

### Installation Instructions
1. Open your terminal or command prompt.
2. Navigate to the project directory.
3. Install required node packages (already done if provisioned by assistant):
   ```bash
   npm install
   ```
4. The database is pre-initialized. But if you wish to wipe the DB and recreate default accounts, run:
   ```bash
   node database/init.js
   ```

### Running the App
1. Start the server:
   ```bash
   node server.js
   ```
2. Open your web browser and navigate to the local testing address:
   ```
   http://localhost:3000
   ```

### Default Demo Accounts
Use the below accounts to experience different user roles. All passwords follow the standard pattern.

- **Admin Portal**: 
  - Email: `admin@clinic.com`
  - Password: `admin123`
- **Receptionist Portal**: 
  - Email: `receptionist@clinic.com`
  - Password: `receptionist123`
- **Doctor Portal**: 
  - Email: `doctor@clinic.com`
  - Password: `doctor123`

You can also register a new **Patient** account directly from the website application page to test the real-time booking flows.

## Features Summary
- ✅ **Authentication:** Role-based logical partition (JWT).
- ✅ **Real-Time Queues:** Patient dashboards update automatically using Socket.IO whenever doctors call patients.
- ✅ **ML Estimation logic:** Average calculation based on historical queue patterns multiplied by patient index.
- ✅ **Rx Integration:** Doctors can save prescriptions digitally attached to history.
