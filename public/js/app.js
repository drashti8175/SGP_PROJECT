const socket = io();

// Globals
let currentUser = null;
let currentTheme = localStorage.getItem('theme') || 'light';

// On load, set theme and check token
window.onload = () => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    const token = localStorage.getItem('token');
    
    if (token) {
        verifyUser(token);
    } else {
        // Automatically detect which form is present on the page
        const hasLogin = !!document.getElementById('loginSection');
        const hasRegister = !!document.getElementById('registerSection');

        if (hasLogin) {
            showAuthSection('loginSection');
        } else if (hasRegister) {
            showAuthSection('registerSection');
        }
    }
};

// --- THEME TOGGLE ---
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    
    const icon = document.querySelector('#themeToggleBtn i');
    if(currentTheme === 'dark') {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
    
    // Re-render charts if they exist
    if(currentUser?.role === 'admin') renderAdminCharts();
}

// --- AUTHENTICATION ---
async function verifyUser(token) {
    try {
        const res = await axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        currentUser = res.data;
        setupUserProfile();
        routeToDashboard();
    } catch (err) {
        console.error(err);
        logout();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const res = await axios.post('/api/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        if (res.data.doctor_id) localStorage.setItem('doctor_id', res.data.doctor_id);
        
        currentUser = { name: res.data.name, role: res.data.role };
        setupUserProfile();
        routeToDashboard();
    } catch (err) {
        alert(err.response?.data?.error || "Login Failed");
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    try {
        await axios.post('/api/auth/register', { name, email, password });
        
        // Auto-login logic
        const res = await axios.post('/api/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        if (res.data.doctor_id) localStorage.setItem('doctor_id', res.data.doctor_id);
        
        window.location.href = 'index.html';
    } catch (err) {
        alert(err.response?.data?.error || "Registration Failed");
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('doctor_id');
    currentUser = null;
    document.getElementById('appLayout').classList.remove('active');
    document.getElementById('authContainer').classList.add('active');
    showAuthSection('loginSection');
}

function setupUserProfile() {
    if(!currentUser) return;
    document.getElementById('userNameDisplay').innerText = currentUser.name;
    document.getElementById('userRoleDisplay').innerText = currentUser.role;
    
    const initials = currentUser.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
    document.getElementById('userAvatar').innerText = initials;
}

// --- ROUTING & UI LAYOUT ---
function showAuthSection(sectionId) {
    document.querySelectorAll('#authContainer .content-view').forEach(sec => sec.classList.remove('active'));
    const section = document.getElementById(sectionId);
    if (section) section.classList.add('active');
}

function showMainView(viewId) {
    document.querySelectorAll('#mainContentViews .content-view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    
    // Update sidebar active state
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[onclick="showMainView('${viewId}')"]`);
    if(activeNav) activeNav.classList.add('active');
}

function routeToDashboard() {
    if (!currentUser) return;
    
    document.getElementById('authContainer').classList.remove('active');
    document.getElementById('appLayout').classList.add('active');
    
    // Hide all views first
    document.querySelectorAll('.content-view').forEach(v => v.classList.remove('active'));
    
    // Show specific dashboard
    const role = currentUser.role;
    if (role === 'patient') {
        document.getElementById('patientDashboard').classList.add('active');
        initPatientDash();
    } else if (role === 'doctor') {
        document.getElementById('doctorDashboard').classList.add('active');
        initDoctorDash();
    } else if (role === 'receptionist') {
        document.getElementById('receptionistDashboard').classList.add('active');
        initReceptionistDash();
    } else if (role === 'admin') {
        document.getElementById('adminDashboard').classList.add('active');
        initAdminDash();
    }
    
    renderSidebar();
}


function renderSidebar() {
    const navs = document.getElementById('sidebarNavs');
    navs.innerHTML = '';
    
    if (currentUser.role === 'patient') {
        navs.innerHTML += `<li class="nav-item active" onclick="showMainView('patientDashboard')"><i class="fa-solid fa-house-medical"></i> Overview</li>`;
        navs.innerHTML += `<li class="nav-item" onclick="document.getElementById('bookDoctorId').focus()"><i class="fa-regular fa-calendar-plus"></i> Book Appointment</li>`;
        navs.innerHTML += `<li class="nav-item"><i class="fa-solid fa-file-prescription"></i> My Records</li>`;
    }
    else if (currentUser.role === 'doctor') {
        navs.innerHTML += `<li class="nav-item active" onclick="showMainView('doctorDashboard')"><i class="fa-solid fa-stethoscope"></i> Live Queue</li>`;
        navs.innerHTML += `<li class="nav-item"><i class="fa-solid fa-users"></i> Patient History</li>`;
    }
    else if (currentUser.role === 'receptionist') {
        navs.innerHTML += `<li class="nav-item active" onclick="showMainView('receptionistDashboard')"><i class="fa-solid fa-desktop"></i> Console</li>`;
        navs.innerHTML += `<li class="nav-item" onclick="alert('Open schedule view!')"><i class="fa-regular fa-calendar-days"></i> Master Schedule</li>`;
    }
    else if (currentUser.role === 'admin') {
        navs.innerHTML += `<li class="nav-item active" onclick="showMainView('adminDashboard')"><i class="fa-solid fa-chart-line"></i> Analytics Dashboard</li>`;
        navs.innerHTML += `<li class="nav-item"><i class="fa-solid fa-users-gear"></i> User Management</li>`;
        navs.innerHTML += `<li class="nav-item"><i class="fa-solid fa-building"></i> Clinic Settings</li>`;
    }
}

function getAuthHeader() {
    return { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
}

// --- VOICE ANNOUNCEMENTS ---
function playVoiceAnnouncement(text) {
    if ('speechSynthesis' in window) {
        const msg = new SpeechSynthesisUtterance(text);
        // Premium touch: Try to use a good english voice
        const voices = window.speechSynthesis.getVoices();
        const engVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Female')) || voices[0];
        if (engVoice) msg.voice = engVoice;
        
        msg.rate = 0.9;
        msg.pitch = 1.1;
        window.speechSynthesis.speak(msg);
    }
}

// --- PATIENT DASHBOARD ---
async function initPatientDash() {
    socket.emit('join_queue'); 

    // Load Doctors for Card Grid
    try {
        const res = await axios.get('/api/doctor');
        const grid = document.getElementById('doctorCardGrid');
        const viewSelect = document.getElementById('viewQueueDoctorId');
        
        grid.innerHTML = ''; 
        viewSelect.innerHTML = '<option value="">Select a Doctor to Track Queue</option>';
        
        res.data.forEach(d => {
            // Card UI
            const card = `
                <div class="doc-card" id="doc-${d._id}" onclick="selectDoctor('${d._id}')">
                    <i class="fa-solid fa-user-doctor"></i>
                    <h4>${d.name}</h4>
                    <p>${d.specialization}</p>
                    <p style="font-weight:600; color:var(--secondary);">$${d.consultationFee}</p>
                </div>
            `;
            grid.innerHTML += card;
            
            // Dropdown for Queue Tracker
            viewSelect.innerHTML += `<option value="${d._id}">${d.name} (${d.specialization})</option>`;
        });
        
        console.log("✅ [DEBUG] Doctors loaded for booking:", res.data);
    } catch (err) { console.error("Error loading doctors:", err); }

    fetchPatientAppointments();
    fetchPatientPrescriptions();
}

function selectDoctor(id) {
    // UI Update
    document.querySelectorAll('.doc-card').forEach(c => c.classList.remove('selected'));
    document.getElementById(`doc-${id}`).classList.add('selected');
    
    // Store Value
    document.getElementById('bookDoctorId').value = id;
}

async function handleBooking(e) {
    e.preventDefault();
    const doctor_id = document.getElementById('bookDoctorId').value;
    const reason_for_visit = document.getElementById('bookReason').value;
    const type = document.querySelector('input[name="priority"]:checked').value;

    try {
        await axios.post('/api/patient/book', { doctor_id, reason_for_visit, type }, getAuthHeader());
        // Show success animation or alert
        alert("Booking request sent successfully to receptionist!");
        fetchPatientAppointments();
    } catch (err) {
        alert(err.response?.data?.error || "Booking failed");
    }
}

async function fetchPatientAppointments() {
    try {
        const res = await axios.get('/api/patient/appointments', getAuthHeader());
        const tbody = document.querySelector('#patientAppointmentsTable tbody');
        tbody.innerHTML = '';
        res.data.forEach(a => {
            tbody.innerHTML += `<tr>
                <td><strong>${a.date}</strong><br><small style="color:var(--text-muted)">Token #${a.token_number}</small></td>
                <td>
                    <strong>${a.doctor_name}</strong><br>
                    <small style="color:var(--text-muted)">${a.reason_for_visit || 'General'}</small>
                </td>
                <td><span class="badge badge-${a.status}">${a.status}</span></td>
                <td><span class="badge ${a.payment_status==='paid'?'badge-completed':'badge-pending'}">${a.payment_status}</span></td>
            </tr>`;
        });
    } catch (err) { console.error(err); }
}

async function fetchPatientQueue() {
    const docId = document.getElementById('viewQueueDoctorId').value;
    const metricsDiv = document.getElementById('queueMetrics');
    if (!docId) { 
        metricsDiv.innerHTML = '<p style="color:var(--text-muted);">Please select a doctor.</p>'; 
        return; 
    }

    try {
        const res = await axios.get(`/api/patient/queue/${docId}`, getAuthHeader());
        const data = res.data;
        
        let html = `<div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
                        <span style="color:var(--text-muted)">Total Patients Today</span>
                        <strong>${data.queue_length}</strong>
                    </div>`;

        if (data.patients_ahead !== null) {
             const progressPct = data.patients_ahead > 0 ? Math.max(10, 100 - (data.patients_ahead * 15)) : 100;
             html += `<div style="background:var(--bg-color); padding:1.5rem; border-radius:var(--radius-sm); border:1px solid var(--border-solid);">
                        <div style="font-size:0.9rem; margin-bottom:5px; color:var(--text-muted)">Patients Ahead</div>
                        <div style="font-size: 2.5rem; font-weight: 700; color: var(--primary); margin-bottom:1rem;">${data.patients_ahead}</div>
                        
                        <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:5px;">
                            <span>Progress</span>
                            <strong>~${data.estimated_wait_time_mins} mins wait</strong>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" style="width: ${progressPct}%"></div>
                        </div>
                      </div>`;
                      
             if (data.is_my_turn) {
                 html += `<div style="margin-top:1rem; padding: 1.5rem; background: var(--secondary-light); border: 1px solid var(--secondary); color: var(--secondary); border-radius: var(--radius-sm); text-align:center;">
                            <i class="fa-solid fa-bell" style="font-size:2rem; margin-bottom:10px;"></i>
                            <h3 style="margin-bottom:5px;">It's your turn!</h3>
                            <p style="font-size:0.9rem;">Please proceed to the doctor's cabin.</p>
                         </div>`;
                 playVoiceAnnouncement(`Attention please. ${currentUser.name}, it is your turn. Please proceed to the cabin.`);
             }
        } else {
             html += `<div style="background:var(--bg-color); padding:1rem; border-radius:var(--radius-sm); text-align:center; color:var(--text-muted);">
                        <i class="fa-regular fa-folder-open" style="font-size:2rem; opacity:0.5; margin-bottom:10px;"></i>
                        <p>No active queue ticket for this doctor today.</p>
                      </div>`;
        }
        metricsDiv.innerHTML = html;
        
        if (data.is_my_turn) document.getElementById('myQueueCard').style.borderColor = 'var(--secondary)';
        else document.getElementById('myQueueCard').style.borderColor = 'var(--primary)';

    } catch (err) { console.error(err); }
}

async function fetchPatientPrescriptions() {
    try {
        const res = await axios.get('/api/patient/prescriptions', getAuthHeader());
        const list = document.getElementById('patientPrescriptionsList');
        if(!list) return;
        list.innerHTML = '';
        res.data.forEach(p => {
            const medList = p.medicines.map(m => `<li><strong>${m.name}</strong> - ${m.dosage}</li>`).join('');
            list.innerHTML += `<div class="card" style="padding: 1.5rem; border-top: 4px solid var(--secondary);"> 
                <h3 style="color:var(--text-main); font-size:1.2rem; margin-bottom:5px;">Patient: ${currentUser.name}</h3>
                <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
                    <div>
                        <h4 style="color:var(--text-main); font-size:1.1rem; margin-bottom:2px;">${p.doctor_name}</h4>
                        <div class="badge badge-confirmed" style="font-size:0.7rem;">${p.diagnosis}</div>
                    </div>
                    <div style="color:var(--text-muted); font-size:0.8rem;">${new Date(p.created_at).toLocaleDateString()}</div>
                </div>
                
                <div style="margin-top:10px;">
                    <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:5px;">Medicines</div>
                    <ul style="font-size:0.9rem; list-style:none; padding:0; margin:0;">
                        ${medList}
                    </ul>
                </div>

                ${p.notes ? `
                <div style="margin-top:10px; padding:10px; background:rgba(0,0,0,0.02); border-radius:5px; font-size:0.85rem; color:var(--text-muted);">
                    <i class="fa-solid fa-info-circle"></i> ${p.notes}
                </div>` : ''}

                <button class="btn btn-secondary btn-sm" style="width:100%; margin-top:1.5rem;"><i class="fa-solid fa-file-pdf"></i> View digital copy</button>
            </div>`;
        });
    } catch (err) { console.error(err); }
}

// Socket Events for Patient
socket.on('appointment_updated', () => { 
    if (currentUser?.role === 'patient') {
        fetchPatientAppointments();
        fetchPatientQueue();
        fetchFullQueue();
    }
});
socket.on('queue_updated', () => { 
    if (currentUser?.role === 'patient') {
        fetchPatientQueue();
        fetchFullQueue();
    }
});
socket.on('new_appointment', () => { 
    if (currentUser?.role === 'patient') {
        fetchPatientQueue();
        fetchFullQueue();
    }
});

// --- DOCTOR DASHBOARD ---
async function initDoctorDash() {
    socket.emit('join_queue');
    fetchDoctorQueue();
}

let activeDocsCallInterval = null;

async function fetchDoctorQueue() {
    try {
        const res = await axios.get('/api/doctor/queue', getAuthHeader());
        const tbody = document.querySelector('#doctorQueueTable tbody');
        tbody.innerHTML = '';
        
        let activePatient = null;
        let activeCount = 0;

        res.data.forEach(a => {
            const status = (a.status || '').toLowerCase();
            if(status !== 'completed' && status !== 'cancelled') activeCount++;
            if(status === 'in-consultation') activePatient = a;

            tbody.innerHTML += `<tr class="${status === 'in-consultation' ? 'queue-item current' : ''}">
                <td><strong style="font-size:1.2rem; color:var(--primary);">#${a.token_number}</strong></td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div class="avatar" style="width:30px; height:30px; font-size:0.7rem;">${a.patient_name[0]}</div>
                        <div>
                            <div style="font-weight:600;">${a.patient_name}</div>
                            <div style="font-size:0.8rem; color:var(--text-muted);">Reason: ${a.reason || 'General'}</div>
                        </div>
                    </div>
                </td>
                <td><span class="badge badge-${a.status}">${a.status}</span></td>
                <td>
                    ${(status === 'confirmed' || status === 'waiting') ? `<button class="btn btn-secondary" style="padding:0.4rem 0.8rem;" onclick="callNextPatient('${a.id}', '${a.patient_name}')"><i class="fa-solid fa-bullhorn"></i> Call</button>` : ''}
                </td>
            </tr>`;
        });
        
        document.getElementById('docQueueActiveCnt').innerText = `${activeCount} Active`;
        document.getElementById('docStatTotal').innerText = res.data.length;
        
        const waitingPatients = res.data.filter(a => a.status === 'Waiting' || a.status === 'confirmed');
        document.getElementById('docStatWaiting').innerText = waitingPatients.length;
        
        if (waitingPatients.length > 0) {
            const next = waitingPatients[0];
            document.getElementById('docStatNext').innerText = `#${next.token_number} - ${next.patient_name}`;
        } else {
            document.getElementById('docStatNext').innerText = '--';
        }        // Update Side Panel (Inline Consultation)
        if(activePatient) {
            document.getElementById('currentPatientName').innerText = activePatient.patient_name;
            document.getElementById('currentPatientMetadata').innerText = `${activePatient.gender || 'N/A'}, ${activePatient.age || 'N/A'} yrs`;
            
            // Populate Vitals
            document.getElementById('vitalBP').innerText = activePatient.vitals?.bp || '120/80';
            document.getElementById('vitalTemp').innerText = activePatient.vitals?.temp || '98.6°F';
            document.getElementById('vitalWeight').innerText = activePatient.vitals?.weight || '70kg';

            // Show Prescription Form
            document.getElementById('inlinePrescriptionForm').classList.remove('hidden');
            document.getElementById('prescApptId').value = activePatient.id;
            document.getElementById('prescPatientId').value = activePatient.patient_id;
            
            document.getElementById('currentPatientActions').innerHTML = ''; // Actions are now inside the form
            
            fetchPatientHistory(activePatient.patient_id);
            
            // Add slight pulse animation to panel
            document.getElementById('currentPatientCard').style.background = 'var(--primary-light)';
        } else {
            document.getElementById('currentPatientName').innerText = 'Select a Patient';
            document.getElementById('currentPatientMetadata').innerText = '--';
            document.getElementById('vitalBP').innerText = '--';
            document.getElementById('vitalTemp').innerText = '--';
            document.getElementById('vitalWeight').innerText = '--';
            document.getElementById('patientHistoryList').innerHTML = '<p style="color:var(--text-muted); text-align:center;">No history</p>';
            document.getElementById('inlinePrescriptionForm').classList.add('hidden');
            document.getElementById('currentPatientActions').innerHTML = '<p style="font-size:0.8rem; color:var(--text-muted);">Please call a patient from the queue to start.</p>';
            document.getElementById('currentPatientCard').style.background = 'transparent';
        }

    } catch (err) { console.error(err); }
}

async function callNextPatient(appointment_id, patient_name) {
    try {
        await axios.post('/api/doctor/call_next', { appointment_id }, getAuthHeader());
        playVoiceAnnouncement(`Patient number ${appointment_id}, ${patient_name}, please proceed to the doctor's cabin.`);
        fetchDoctorQueue();
    } catch (err) { alert(err.response?.data?.error || "Error"); }
}

async function markComplete(appointment_id) {
    try {
        await axios.post('/api/doctor/complete', { appointment_id }, getAuthHeader());
        fetchDoctorQueue();
    } catch (err) { alert(err.response?.data?.error || "Error"); }
}

function addMedicineRow() {
    const row = document.createElement('div');
    row.style = "display:grid; grid-template-columns: 2fr 1fr; gap:3px; margin-bottom:3px;";
    row.innerHTML = `
        <input type="text" class="form-control med-name" style="padding:0.4rem; font-size:0.75rem;" placeholder="Med" required>
        <input type="text" class="form-control med-dose" style="padding:0.4rem; font-size:0.75rem;" placeholder="Dose" required>
    `;
    document.getElementById('medicineRows').appendChild(row);
}

async function handlePrescriptionSubmit(e) {
    e.preventDefault();
    const appointment_id = document.getElementById('prescApptId').value;
    const patient_id = document.getElementById('prescPatientId').value;
    const diagnosis = document.getElementById('prescDiagnosis').value;
    const notes = document.getElementById('prescNotes').value;
    
    const medNames = document.querySelectorAll('.med-name');
    const medDoses = document.querySelectorAll('.med-dose');
    
    const medicines = [];
    for(let i=0; i<medNames.length; i++) {
        if(medNames[i].value) {
            medicines.push({
                name: medNames[i].value,
                dosage: medDoses[i].value,
                duration: 'Standard'
            });
        }
    }

    try {
        await axios.post('/api/doctor/prescribe', { appointment_id, patient_id, diagnosis, medicines, notes }, getAuthHeader());
        alert("Patient Consultation Finished! Medical record updated.");
        
        // Reset and hide form
        document.getElementById('prescForm').reset();
        document.getElementById('inlinePrescriptionForm').classList.add('hidden');
        
        // Mark as complete and refresh queue
        await markComplete(appointment_id);
    } catch (err) { alert(err.response?.data?.error || "Error"); }
}

async function fetchPatientHistory(patient_id) {
    try {
        const res = await axios.get(`/api/doctor/patient-history/${patient_id}`, getAuthHeader());
        const list = document.getElementById('patientHistoryList');
        if(!list) return;
        if(res.data.length === 0) {
            list.innerHTML = '<p style="color:var(--text-muted); text-align:center;">No history</p>';
            return;
        }
        list.innerHTML = res.data.map(h => `
            <div style="border-bottom: 1px solid var(--border-solid); padding: 8px 0;">
                <div style="display:flex; justify-content:space-between; font-size:0.7rem;">
                    <strong>${new Date(h.createdAt).toLocaleDateString()}</strong>
                    <span style="color:var(--primary)">${h.diagnosis}</span>
                </div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
                    ${h.medicines.map(m => m.name).join(', ')}
                </div>
            </div>
        `).join('');
    } catch (err) { console.error(err); }
}

async function fetchFullQueue() {
    const docId = document.getElementById('viewQueueDoctorId').value;
    if (!docId) return;
    try {
        const res = await axios.get(`/api/patient/full-queue/${docId}`, getAuthHeader());
        const list = document.getElementById('fullQueueList');
        if(!list) return;
        list.innerHTML = res.data.map(a => `
            <div class="queue-item" style="padding:0.8rem; margin-bottom:5px; border-left: 4px solid var(--primary);">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span><strong style="font-size:1.1rem; color:var(--primary);">#${a.token_number}</strong> &nbsp; ${a.patient_name}</span>
                    <span class="badge badge-${a.status}" style="font-size:0.6rem;">${a.status}</span>
                </div>
            </div>
        `).join('') || '<p style="color:var(--text-muted); text-align:center;">No patients in queue yet.</p>';
    } catch (err) { console.error(err); }
}

socket.on('appointment_updated', () => { 
    fetchPatientAppointments();
    fetchPatientQueue();
    fetchDoctorQueue();
    fetchReceptionistRequests();
});
socket.on('queue_updated', () => { 
    fetchPatientQueue();
    fetchDoctorQueue();
    fetchReceptionistRequests();
});
socket.on('new_appointment', () => { 
    fetchPatientQueue();
    fetchDoctorQueue();
    fetchReceptionistRequests();
});

// --- RECEPTIONIST DASHBOARD ---
async function initReceptionistDash() {
    socket.emit('join_queue');
    fetchReceptionistRequests();
}

async function fetchReceptionistRequests() {
    try {
        const res = await axios.get('/api/receptionist/requests', getAuthHeader());
        const tbody = document.querySelector('#receptionistTable tbody');
        tbody.innerHTML = '';
        
        let pendingCnt = 0;

        res.data.forEach(a => {
            const status = (a.status || '').toLowerCase();
            if(status === 'pending') pendingCnt++;
            tbody.innerHTML += `<tr>
                <td><strong>${a.date}</strong><br><small style="color:var(--text-muted)">Token #${a.token_number}</small></td>
                <td>
                    <strong>${a.patient_name}</strong><br>
                    <small style="color:var(--text-muted)">Reason: ${a.reason_for_visit || 'General'}</small>
                </td>
                <td><span style="font-weight:500;">${a.doctor_name}</span></td>
                <td>
                    <span class="badge badge-${a.status}" style="margin-bottom:5px; display:inline-block;">${a.status}</span><br>
                    <span class="badge ${a.payment_status === 'paid' ? 'badge-completed' : 'badge-pending'}">${a.payment_status}</span>
                </td>
                <td>
                    <div style="display:flex; flex-wrap:wrap; gap:5px;">
                        ${(status === 'pending' || status === 'waiting') ? `
                            <button class="btn btn-success" title="Confirm/Approve" style="padding: 0.4rem 0.6rem; font-size:0.8rem;" onclick="updateApptStatus('${a.id}', 'confirmed')"><i class="fa-solid fa-check"></i></button>
                            <button class="btn btn-danger" title="Cancel" style="padding: 0.4rem 0.6rem; font-size:0.8rem;" onclick="updateApptStatus('${a.id}', 'cancelled')"><i class="fa-solid fa-xmark"></i></button>
                        ` : ''}
                        ${(status === 'confirmed' || status === 'waiting') ? `
                           <button class="btn btn-secondary" title="Check-In" style="padding: 0.4rem 0.6rem; font-size:0.8rem;" onclick="markCheckIn('${a.id}')"><i class="fa-solid fa-qrcode"></i></button>
                        ` : ''}
                        ${a.payment_status === 'pending' ? `
                           <button class="btn" style="padding: 0.4rem 0.6rem; font-size:0.8rem;" onclick="markPaid('${a.id}')"><i class="fa-solid fa-dollar-sign"></i> Pay</button>
                        ` : ''}
                    </div>
                </td>
            </tr>`;
        });
        
        document.getElementById('receptPendingReq').innerText = pendingCnt;

    } catch (err) { console.error(err); }
}

async function updateApptStatus(appointment_id, status) {
    if(!confirm(`Are you sure you want to ${status} this appointment?`)) return;
    try {
        await axios.post('/api/receptionist/update_status', { appointment_id, status }, getAuthHeader());
        fetchReceptionistRequests();
    } catch (err) { alert(err.response?.data?.error || "Error"); }
}

async function markCheckIn(appointment_id) {
    try {
        await axios.post('/api/receptionist/checkin', { appointment_id }, getAuthHeader());
        alert("Patient Effectively Checked In! They are now in the live queue.");
        fetchReceptionistRequests();
    } catch (err) { alert(err.response?.data?.error || "Error"); }
}

async function markPaid(appointment_id) {
    try {
        await axios.post('/api/receptionist/payment', { appointment_id, payment_status: 'paid' }, getAuthHeader());
        fetchReceptionistRequests();
    } catch (err) { alert(err.response?.data?.error || "Error"); }
}

socket.on('appointment_updated', () => { if (currentUser?.role === 'receptionist') fetchReceptionistRequests(); });
socket.on('queue_updated', () => { if (currentUser?.role === 'receptionist') fetchReceptionistRequests(); });
socket.on('new_appointment', () => { if (currentUser?.role === 'receptionist') fetchReceptionistRequests(); });

// --- ADMIN DASHBOARD ---
let pChartInstance = null;
let rChartInstance = null;

async function initAdminDash() {
    try {
        const stats = await axios.get('/api/admin/stats', getAuthHeader());
        document.getElementById('statPatients').innerText = stats.data.patients_today;
        document.getElementById('statRevenue').innerText = `$${stats.data.total_revenue}`;
        document.getElementById('statDoctors').innerText = stats.data.total_doctors;

        const usersRes = await axios.get('/api/admin/users', getAuthHeader());
        const tbody = document.querySelector('#adminUsersTable tbody');
        tbody.innerHTML = '';
        usersRes.data.forEach(u => {
            const initials = u.name[0].toUpperCase();
            tbody.innerHTML += `<tr>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div class="avatar" style="width:30px; height:30px; font-size:0.8rem;">${initials}</div>
                        <strong>${u.name}</strong>
                    </div>
                </td>
                <td>${u.email}</td>
                <td><span class="badge ${u.role==='admin'?'badge-completed':u.role==='doctor'?'badge-confirmed':'badge-pending'}" style="text-transform: capitalize;">${u.role}</span></td>
                <td>${new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>`;
        });
        
        renderAdminCharts();
    } catch (err) { console.error(err); }
}

function renderAdminCharts() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    
    // Chart 1: Patients
    const ctx1 = document.getElementById('patientChart').getContext('2d');
    if(pChartInstance) pChartInstance.destroy();
    
    // Mock Data for week
    pChartInstance = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Patients',
                data: [12, 19, 15, 22, 29, 10, 5],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: gridColor }, ticks: { color: textColor } },
                x: { grid: { display: false }, ticks: { color: textColor } }
            }
        }
    });

    // Chart 2: Revenue
    const ctx2 = document.getElementById('revenueChart').getContext('2d');
    if(rChartInstance) rChartInstance.destroy();
    
    // Mock Data for week
    rChartInstance = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Revenue ($)',
                data: [350, 550, 420, 680, 800, 300, 150],
                backgroundColor: '#10b981',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: gridColor }, ticks: { color: textColor } },
                x: { grid: { display: false }, ticks: { color: textColor } }
            }
        }
    });
}
