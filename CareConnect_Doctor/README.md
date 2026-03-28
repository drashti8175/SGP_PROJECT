# CareConnect - Doctor Module

This completely standalone Doctor Module directory contains the advanced backend features and beautiful glassmorphism UI requested.

## Features Included
1. **Doctor Dashboard** (`doctor_dashboard.html`)
   - Live Patient Queue
   - Auto-refreshing Realtime Clock
   - Stats (Patients Waiting, Avg Consult Time, Emergency Count)
   - Current Patient Consultation Panel (Vitals & Complaints)
   - Shift Overview Progress Bar
   - Quick Action Buttons (Rx Pad, Lab Test)
   - Emergency Mode & PA Announce Delay Buttons
   - **Smart Alerts System** (Red Dropdown Bell showing Missed/Emergency alerts)
   
2. **Advanced Performance Analytics** (`doctor_performance.html`)
   - Chart.js integration showing Daily Patient Volume vs Average Consult Times.
   - Key metrics (Satisfaction, Peak Hours, Handled Capacity).

3. **Patient Medical History Timeline** (`patient_history.html`)
   - Fetching and populating historical data in a scrollable, beautiful vertical timeline view.
   - Includes historical prescriptions, diagnosis, and doctor notes.

## How to Run

1. Open your terminal and navigate to the backend folder:
   ```bash
   cd CareConnect_Doctor/backend
   ```
2. Start the API server:
   ```bash
   node server.js
   ```
   *Note: The system automatically provisions a Local In-Memory MongoDB Database and smartly injects dummy Patients, Appointment Queues, Timelines, and Smart Alerts so you can immediately showcase the application to your professors or teammates without any complex cloud setups.*

3. Open the Frontend Pages directly in your browser (Double click the HTML files):
   - `CareConnect_Doctor/frontend/html/doctor_dashboard.html`
   - `CareConnect_Doctor/frontend/html/doctor_performance.html`
   - `CareConnect_Doctor/frontend/html/patient_history.html`
