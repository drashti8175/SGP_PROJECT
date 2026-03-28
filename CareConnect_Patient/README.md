# CareConnect Patient Module

🚀 A complete Patient Module for the CareConnect Clinic Management System. Built with HTML, CSS (Glassmorphism), Vanilla JS, Node.js + Express, and MongoDB.

## Features Included
- **Dashboard**: Overview of upcoming appointments and quick actions.
- **Appointment Booking**: Dynamic token generation per doctor.
- **Queue Status**: Live preview of the current serving token.
- **Prescriptions**: View prescribed medicines.
- **History & Notifications**: Appointment history and system alerts.
- **Profile Management**: Update user details.

## Step-by-Step Setup Instructions

### Prerequisites
1. Install [Node.js](https://nodejs.org/)
2. Install [MongoDB Community Server](https://www.mongodb.com/try/download/community) and ensure it is running on default port `27017`.

### 1. Backend Setup & Running
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd CareConnect_Patient/backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Load sample dummy data (Creates default patient, doctors, etc):
   ```bash
   node seed.js
   ```
   *Note: This will create a dummy patient `john@example.com` with password `password123`.*
4. Start the backend Server:
   ```bash
   npm start
   ```
   The backend should now be running on `http://localhost:5000`.

### 2. Frontend Setup
1. The frontend operates entirely on static HTML/CSS/JS. No bundler is required.
2. Open `CareConnect_Patient/frontend/html/login.html` directly in your browser or run it using a VS Code Live Server extension.
3. Login using:
   - Email: **john@example.com**
   - Password: **password123**

### Design Notes
- Built using **pure CSS (Glassmorphism)** to ensure an extremely modern, premium experience.
- Soft primary colors (`#4f46e5`) are used to create trust, standard in healthcare UI interfaces.
- Uses Font-Awesome for iconography.

Feel free to present this project!
