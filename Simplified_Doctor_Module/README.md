# Simplified Doctor Module - CareConnect

This module is a simplified version of the doctor system with pre-defined accounts and role-specific dashboards.

## 🚀 How to Run

1. **Start the Backend**:
   - Open your terminal.
   - Run:
     ```bash
     cd Simplified_Doctor_Module/backend
     node server.js
     ```
   - *This will automatically seed the 2 doctors and start a local memory database (no setup needed!)*

2. **Open the Frontend**:
   - **Booking Page**: Open `Simplified_Doctor_Module/frontend/booking.html` in your browser. Select a doctor and book an appointment to see the token system in action.
   - **Doctor Login**: Open `Simplified_Doctor_Module/frontend/login.html`.

## 🧑‍⚕️ Pre-defined Doctor Accounts

| Name | Specialization | Username | Password |
|------|----------------|----------|----------|
| Dr. Sushma | Cardiologist | `sushma` | `1234` |
| Dr. Hemant | General Physician | `hemant` | `1234` |

## ✨ Key Features
- **Independent Queues**: If Patient A books Dr. Sushma, they get Token #1. If Patient B books Dr. Hemant, they *also* get Token #1.
- **Doctor Specific View**: Logging in as `sushma` will only show appointments booked for Dr. Sushma.
- **No Registration**: The doctor list is fixed, making it perfect for a stable university demonstration.
