const BASE_URL = 'http://localhost:3000/api';

const API = {
    // 1. Core Request Wrapper
    request: async function(endpoint, method = 'GET', body = null) {
        let token = localStorage.getItem('token');
        
        // Auto-login fallback for seamless demo if token is missing
        if (!token && endpoint !== '/auth/login') {
            console.log("No token found. Attempting auto-login...");
            await this.login();
            token = localStorage.getItem('token');
        }

        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = {
            method,
            headers
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, options);
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'API Request Failed');
            }
            return await response.json();
        } catch (error) {
            console.error(`[API ERROR] ${endpoint}:`, error);
            throw error;
        }
    },

    // 2. Authentication
    login: async function() {
        try {
            const data = await this.request('/auth/login', 'POST', {
                email: 'doctor@demo.com',
                password: 'password123',
                role: 'doctor'
            });
            localStorage.setItem('token', data.token);
            console.log("✅ Auto-Login Successful. Token saved.");
            return data;
        } catch (error) {
            console.error("❌ Auto-Login Failed. Please make sure the seed script was run.", error);
        }
    },

    // 3. Queue Management
    getQueue: async function() {
        return await this.request('/doctor/queue');
    },

    callNext: async function(appointmentId) {
        return await this.request('/doctor/call_next', 'POST', { appointment_id: appointmentId });
    },

    completeConsultation: async function(appointmentId) {
        return await this.request('/doctor/complete', 'POST', { appointment_id: appointmentId });
    },

    // 4. Clinical Data
    getStats: async function() {
        return await this.request('/doctor/stats');
    },

    getHistory: async function(patientId) {
        return await this.request(`/doctor/patient-history/${patientId}`);
    },

    getPatientProfile: async function(patientId) {
        return await this.request(`/doctor/patient/${patientId}`);
    },

    prescribe: async function(payload) {
        // payload expects: { appointment_id, patient_id, diagnosis, medicines, notes }
        return await this.request('/doctor/prescribe', 'POST', payload);
    }
};

// Initialize API and token on script load
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('token')) {
        API.login().then(() => {
            window.dispatchEvent(new Event('API_READY'));
        });
    } else {
        setTimeout(() => window.dispatchEvent(new Event('API_READY')), 100);
    }
});
