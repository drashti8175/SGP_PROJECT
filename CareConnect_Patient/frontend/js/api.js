const API_BASE = 'http://localhost:3000/api';

const api = {
    async login(email, password) {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return res.json();
    },
    
    async getPatient(id) {
        const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return res.json();
    },
    
    async getAppointments() {
        const res = await fetch(`${API_BASE}/patient/appointments`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return res.json();
    },
    
    async getDoctors() {
        const res = await fetch(`${API_BASE}/doctor`);
        return res.json();
    },
    
    async bookAppointment(data) {
        const res = await fetch(`${API_BASE}/patient/book`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                doctor_id: data.doctor_id,
                reason_for_visit: data.reason_for_visit,
                type: data.type || 'Normal'
            })
        });
        return res.json();
    },
    
    async getQueueStatus(doctorId) {
        const res = await fetch(`${API_BASE}/patient/queue/${doctorId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return res.json();
    },
    
    async getPrescriptions() {
        const res = await fetch(`${API_BASE}/patient/prescriptions`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return res.json();
    },
    
    async updateProfile(data) {
        const res = await fetch(`${API_BASE}/patient/update`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });
        return res.json();
    }
};
