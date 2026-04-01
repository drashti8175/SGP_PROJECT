// Utilities for Auth and Navigation
function checkAuth() {
    const patientId = localStorage.getItem('careconnect_patientId');
    if (!patientId && !window.location.href.includes('login.html')) {
        window.location.href = 'login.html';
    }
    return patientId;
}

function logout() {
    localStorage.removeItem('careconnect_patientId');
    localStorage.removeItem('careconnect_name');
    window.location.href = 'login.html';
}

function renderSidebar(activePage) {
    const userName = localStorage.getItem('careconnect_name') || 'Patient';
    const init = userName.charAt(0).toUpperCase();

    const sidebarHTML = `
        <div class="brand">
            <i class="fa-solid fa-heart-pulse"></i>
            CareConnect
        </div>
        <ul class="nav-links">
            <a href="dashboard.html" class="nav-link ${activePage === 'dashboard' ? 'active' : ''}"><i class="fa-solid fa-house"></i> Dashboard</a>
            <a href="booking.html" class="nav-link ${activePage === 'booking' ? 'active' : ''}"><i class="fa-solid fa-calendar-plus"></i> Book Appointment</a>
            <a href="queue.html" class="nav-link ${activePage === 'queue' ? 'active' : ''}"><i class="fa-solid fa-people-arrows"></i> Track Queue</a>
            <a href="prescriptions.html" class="nav-link ${activePage === 'prescriptions' ? 'active' : ''}"><i class="fa-solid fa-prescription-bottle-medical"></i> Prescriptions</a>
            <a href="history.html" class="nav-link ${activePage === 'history' ? 'active' : ''}"><i class="fa-solid fa-clock-rotate-left"></i> History</a>
            <a href="notifications.html" class="nav-link ${activePage === 'notifications' ? 'active' : ''}"><i class="fa-solid fa-bell"></i> Notifications</a>
        </ul>

        <div class="user-profile" onclick="window.location.href='profile.html'">
            <div class="user-avatar">${init}</div>
            <div class="user-info">
                <h4>${userName}</h4>
                <p>View Profile</p>
            </div>
        </div>
        <a href="#" onclick="logout()" class="nav-link text-danger" style="margin-top: 10px;"><i class="fa-solid fa-right-from-bracket"></i> Logout</a>
    `;
    const sidebarRef = document.getElementById('sidebar-container');
    if (sidebarRef) {
        sidebarRef.className = 'sidebar';
        sidebarRef.innerHTML = sidebarHTML;
    }
}

// Format Dates
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}
