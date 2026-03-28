const API_BASE = 'http://localhost:3000/api/doctor';

const api = {
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        };
    },
    async getStats() {
        const res = await fetch(`${API_BASE}/stats`, { headers: this.getHeaders() });
        return res.json();
    },
    async getQueue() {
        const res = await fetch(`${API_BASE}/queue`, { headers: this.getHeaders() });
        return res.json();
    },
    async callNextPatient(appointmentId) {
        const res = await fetch(`${API_BASE}/call_next`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ appointment_id: appointmentId })
        });
        return res.json();
    },
    async getPerformance() {
        const res = await fetch(`${API_BASE}/performance`, { headers: this.getHeaders() });
        return res.json();
    },
    async getNotifications() {
        const res = await fetch(`${API_BASE}/notifications`, { headers: this.getHeaders() });
        return res.json();
    },
    async getPatientInfo(patientId) {
        const res = await fetch(`${API_BASE}/patient/${patientId}`, { headers: this.getHeaders() });
        return res.json();
    },
    async markNotificationRead(id) {
        const res = await fetch(`${API_BASE}/notifications/read`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ notif_id: id })
        });
        return res.json();
    },
    async getPatientHistory(patientId) {
        const res = await fetch(`${API_BASE}/history/${patientId}`, { headers: this.getHeaders() });
        return res.json();
    },
    async prescribe(appointmentId, details) {
        const res = await fetch(`${API_BASE}/prescribe`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ appointment_id: appointmentId, details })
        });
        return res.json();
    }
};
