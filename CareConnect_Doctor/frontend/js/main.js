// ==========================================
// 🚀 MEDI-CORE DOCTOR MODULE CONTROLLER
// Wired explicitly to System.js (MOCK DB offline mode)
// ==========================================

function renderSidebar(activePage) {
    const sidebarHTML = `
        <div class="brand">
            <i class="fa-solid fa-user-doctor"></i> MediCore
        </div>
        <ul class="nav-links">
            <a href="doctor_dashboard.html" class="nav-item ${activePage === 'dashboard' ? 'active' : ''}"><i class="fa-solid fa-border-all"></i> Dashboard</a>
            <a href="#" class="nav-item"><i class="fa-solid fa-users"></i> Queue</a>
            <a href="patient_history.html" class="nav-item ${activePage === 'history' ? 'active' : ''}"><i class="fa-solid fa-address-card"></i> Patient Details</a>
            <a href="#" class="nav-item"><i class="fa-solid fa-file-invoice"></i> Reports</a>
            <a href="doctor_performance.html" class="nav-item ${activePage === 'performance' ? 'active' : ''}"><i class="fa-solid fa-trophy"></i> Performance</a>
        </ul>
        <div style="margin-top:auto; padding-top:20px;">
            <a href="#" class="nav-item" style="color:var(--text-muted);"><i class="fa-solid fa-gear"></i> Settings</a>
            <div class="user-profile mt-2" onclick="window.location.href='/login.html'">
                <div class="avatar">DR</div>
                <div style="flex:1;">
                    <div style="font-size:0.9rem; font-weight:700; color:var(--dark);">Dr. Rashmi</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">Cardiologist</div>
                </div>
                <i class="fa-solid fa-chevron-right text-muted" style="font-size:0.8rem;"></i>
            </div>
        </div>
    `;
    const sidebarRef = document.getElementById('sidebar');
    if (sidebarRef) sidebarRef.innerHTML = sidebarHTML;
}

let activeVitalsInterval = null;

const Dashboard = {
    init() {
        if(typeof System === 'undefined') {
            console.error("System Engine not loaded. Ensure system.js is included.");
            return;
        }

        renderSidebar('dashboard');

        // Extract native queue
        const queue = System.getQueue();
        
        // Compute Native Stats
        const totalAppointments = queue.length;
        const completeQueue = queue.filter(q => q.status === "completed" || q.status === "skipped").length;
        const waitingQueue = queue.filter(q => q.status === "waiting" || q.status === "skipped"); // For counting
        const emergencyCount = queue.filter(q => q.type === "Emergency" && q.status !== "completed").length;
        
        const stats = {
            total: totalAppointments,
            waiting: waitingQueue.length,
            done: completeQueue,
            emergency: emergencyCount,
            avgTime: Math.floor(Math.random() * 5 + 10) // Mock 10-15m
        };

        this.updateStatsUI(stats);
        this.updateQueueUI(queue);
    },

    updateStatsUI(stats) {
        if(!document.getElementById('statTotal')) return;
        
        document.getElementById('statTotal').innerText = stats.total;
        document.getElementById('statWaiting').innerText = stats.waiting;
        document.getElementById('statEmergency').innerText = stats.emergency;
        document.getElementById('statAvg').innerText = stats.avgTime;

        // Today's Overview specific
        if(document.getElementById('qsWaiting')) document.getElementById('qsWaiting').innerText = stats.waiting;
        if(document.getElementById('qsDone')) document.getElementById('qsDone').innerText = stats.done;

        // Shift Progress Calculation (Fake 8 hour shift progressing based on completed ratios)
        const pct = stats.total === 0 ? 0 : (stats.done / stats.total) * 100;
        const elapsedHours = Math.floor((pct / 100) * 8);
        const elapsedMins = Math.floor(((pct / 100) * 8 - elapsedHours) * 60);

        if(document.getElementById('shiftBar')) document.getElementById('shiftBar').style.width = \`\${pct}%\`;
        if(document.getElementById('shiftText')) document.getElementById('shiftText').innerText = \`\${elapsedHours}h \${elapsedMins}m elapsed / 8h shift\`;
    },

    updateQueueUI(queue) {
        const stackList = document.getElementById('queueStack');
        if(!stackList) return;

        let activePatient = null;
        let nextPatient = null;
        
        const pendingQueue = queue.filter(q => q.status === 'waiting' || q.status === 'skipped');
        const activeQueue = queue.find(q => q.status === 'in-consultation');

        // Identify who holds the current panel (either active, or the immediate next)
        if(activeQueue) {
            activePatient = activeQueue;
        } else if(pendingQueue.length > 0) {
            nextPatient = pendingQueue[0];
        }

        // Render Right Stack (Queue)
        if(pendingQueue.length === 0) {
            stackList.innerHTML = '<p class="text-muted text-center" style="padding: 2rem;">Queue is empty.</p>';
        } else {
            stackList.innerHTML = pendingQueue.map(q => {
                const isEmergency = q.type === 'Emergency' || q.priority === 'High';
                const badgeHtml = isEmergency ? \`<span class="badge badge-emergency">Emergency</span>\` : \`<span class="badge badge-regular">Regular</span>\`;
                
                // Add fake time schedule based on token number logic
                let h = 9 + Math.floor(q.token_number / 4);
                let m = (q.token_number % 4) * 15;
                const ampm = h >= 12 ? 'PM' : 'AM';
                h = h % 12 || 12;
                const timeStr = \`\${h < 10 ? '0'+h : h}:\${m === 0 ? '00' : m} \${ampm}\`;

                return \`
                    <div class="queue-card">
                        <div style="display: flex; gap: 16px; align-items: center;">
                            <div style="color: var(--accent); font-weight: 700; font-size: 1.1rem; min-width: 40px; text-align: center; background: rgba(14, 165, 233, 0.05); padding: 8px; border-radius: 8px;">\${q.token_number}</div>
                            <div>
                                <div style="font-weight: 600; font-size: 0.95rem; color: var(--dark);">\${q.patient_name}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted);"><i class="fa-regular fa-clock"></i> \${timeStr}</div>
                            </div>
                        </div>
                        <div>\${badgeHtml}</div>
                    </div>
                \`;
            }).join('');
        }

        if(document.getElementById('plannedCount')) document.getElementById('plannedCount').innerText = pendingQueue.length;

        // Render Left Panel (Consultation Hub)
        this.updateConsultationPanel(activePatient, nextPatient);
    },

    updateConsultationPanel(activePatient, nextPatient) {
        const panel = document.getElementById('currentPanel');
        if(!panel) return;

        const p = activePatient || nextPatient;

        if(!p) {
            panel.innerHTML = '<p class="text-muted text-center" style="padding: 2rem;"><i class="fa-solid fa-stethoscope" style="font-size: 2rem; opacity: 0.2; display: block; margin-bottom: 12px;"></i> No patients waiting</p>';
            return;
        }

        const isEmergency = p.type === 'Emergency';
        const isConsulting = p.status === 'in-consultation';
        
        let riskBadge = isEmergency ? '<span class="badge badge-emergency">CRITICAL</span>' : '<span class="badge badge-success">Low Risk</span>';
        let actionBtn = isConsulting ? 
            \`<button class="btn btn-primary" style="flex:1;" onclick="handleCompleteConsultation('\${p.id}')"><i class="fa-solid fa-check"></i> Complete Consultation</button>\` : 
            \`<button class="btn btn-primary" style="flex:1;" onclick="handleCallPatient('\${p.id}')"><i class="fa-solid fa-user-plus"></i> Call Patient to Cabin</button>\`;

        panel.innerHTML = \`
            <!-- Top Tags -->
            <div class="flex-between mb-4">
                \${riskBadge}
                <div style="color:var(--accent); font-size:0.8rem; font-weight:600;">\${isConsulting ? 'Consultation Active' : 'Estimated Start In 2 mins'}</div>
            </div>

            <!-- Profile Info -->
            <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 24px;">
                <div class="avatar" style="width: 60px; height: 60px; font-size: 1.5rem; background: var(--bg-color); color: var(--accent);">
                    <i class="fa-solid fa-user"></i>
                </div>
                <div>
                    <h2 style="font-size: 1.4rem; color: var(--dark); margin-bottom: 4px;">\${p.patient_name}</h2>
                    <div style="color: var(--text-muted); font-size: 0.85rem;">Token #\${p.token_number} • \${p.reason || 'General Checkup'}</div>
                </div>
            </div>

            <!-- Mini details -->
            <div class="flex-between mb-4 pb-4" style="border-bottom: 1px solid var(--border);">
                <div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); text-transform:uppercase; font-weight:600;">Last Visit</div>
                    <div style="font-size: 0.9rem; font-weight: 500;">\${System.MOCK_DB.patients.find(x=>x.name === p.patient_name)?.lastVisit || 'First Time'}</div>
                </div>
                <div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); text-transform:uppercase; font-weight:600;">Vitals</div>
                    <div style="font-size: 0.9rem; font-weight: 500; color: \${isEmergency ? 'var(--danger)' : 'var(--success)'};">\${isEmergency?'Unstable':'Stable'}</div>
                </div>
                <div></div>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; gap: 12px;">
                \${actionBtn}
                <button class="btn btn-outline" style="min-width: 120px;" onclick="handleSkipPatient('\${p.id}')"><i class="fa-solid fa-forward-step"></i> Skip</button>
            </div>
        \`;
    }
};

// Global Handlers hitting local System
function handleCallPatient(id) {
    if(typeof System === 'undefined') return;
    System.callNext(id); // Using the explicit force-call logic if ID is provided, else natural next
    Dashboard.init();
}

function handleSkipPatient(id) {
    if(typeof System === 'undefined') return;
    System.skipPatient(id);
    Dashboard.init();
}

function handleCompleteConsultation(id) {
    if(typeof System === 'undefined') return;
    
    // Minimal mock prescription CDSS hook
    const notes = prompt("Enter Prescription / Notes (e.g., 'Paracetamol, Penicillin'):");
    if(notes) {
        const medsFound = notes.split(',').map(x=>x.trim());
        const alerts = System.CDSS.runAllChecks(medsFound, ["Penicillin"]); // Simulate allergy
        if(alerts.some(a => a.type === 'danger')) {
            alert(\`⚠️ CDSS BLOCKED: \${alerts.find(a=>a.type==='danger').message}\`);
            return;
        }
        System.completeConsultation(id, {diagnosis: 'Routine check', medicines: medsFound, notes});
    } else {
        // Complete anyway
        System.completeConsultation(id, null);
    }
    
    Dashboard.init();
}
