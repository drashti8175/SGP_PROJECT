function renderSidebar(activePage) {
    const sidebarHTML = `
        <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary); margin-bottom: 2rem; display: flex; align-items: center; gap: 10px;">
            <i class="fa-solid fa-user-doctor"></i> Doctor Panel
        </div>
        <ul class="nav-links">
            <a href="doctor_dashboard.html" class="nav-item ${activePage === 'dashboard' ? 'active' : ''}"><i class="fa-solid fa-border-all"></i> Dashboard</a>
            <a href="doctor_performance.html" class="nav-item ${activePage === 'performance' ? 'active' : ''}"><i class="fa-solid fa-chart-line"></i> Analytics & Perf</a>
            <a href="patient_history.html" class="nav-item ${activePage === 'history' ? 'active' : ''}"><i class="fa-solid fa-timeline"></i> Patient History</a>
            <a href="#" class="nav-item"><i class="fa-solid fa-file-waveform"></i> Reports</a>
            <a href="#" class="nav-item"><i class="fa-solid fa-gear"></i> Settings</a>
            <a href="#" class="nav-item mt-4 text-danger"><i class="fa-solid fa-right-from-bracket"></i> Logout</a>
        </ul>
    `;
    const sidebarRef = document.getElementById('sidebar');
    if (sidebarRef) sidebarRef.innerHTML = sidebarHTML;
}

// Global clock
setInterval(() => {
    const clock = document.getElementById('realtime-clock');
    if(clock) clock.innerText = new Date().toLocaleTimeString();
}, 1000);

// Toggle Alerts Dropdown
function toggleAlerts() {
    const d = document.getElementById('alertsDropdown');
    if(d) d.classList.toggle('active');
}

// Centralized Alerts Manager
async function loadAlertsUI() {
    try {
        const notifs = await api.getNotifications();
        const countBadge = document.getElementById('alertCountBadge');
        const container = document.getElementById('alertsContainer');
        
        if(notifs.length > 0) {
            countBadge.innerText = notifs.length;
            countBadge.style.display = 'flex';
        } else {
            countBadge.style.display = 'none';
        }

        if(container) {
            container.innerHTML = notifs.map(n => `
                <div class="alert-item alert-${n.type}">
                    <strong>${n.type.toUpperCase()}:</strong> ${n.message}
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 5px;">${new Date(n.timestamp).toLocaleTimeString()}</div>
                </div>
            `).join('');
            if(notifs.length === 0) container.innerHTML = '<p class="text-muted text-center" style="padding:1rem;">No alerts</p>';
        }
    } catch(err) { console.error('Error loading alerts:', err); }
}
