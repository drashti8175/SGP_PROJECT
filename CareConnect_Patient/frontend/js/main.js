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
    const sidebarHTML = `
        <div class="sidebar-header">
            <i class="fa-solid fa-heart-pulse"></i>
            CareConnect
        </div>
        <ul class="nav-links">
            <a href="dashboard.html" class="nav-item ${activePage === 'dashboard' ? 'active' : ''}"><i class="fa-solid fa-house"></i> Dashboard</a>
            <a href="booking.html" class="nav-item ${activePage === 'booking' ? 'active' : ''}"><i class="fa-solid fa-calendar-plus"></i> Book Appointment</a>
            <a href="queue.html" class="nav-item ${activePage === 'queue' ? 'active' : ''}"><i class="fa-solid fa-people-arrows"></i> Track Queue</a>
            <a href="prescriptions.html" class="nav-item ${activePage === 'prescriptions' ? 'active' : ''}"><i class="fa-solid fa-prescription-bottle-medical"></i> Prescriptions</a>
            <a href="history.html" class="nav-item ${activePage === 'history' ? 'active' : ''}"><i class="fa-solid fa-clock-rotate-left"></i> History</a>
            <a href="notifications.html" class="nav-item ${activePage === 'notifications' ? 'active' : ''}"><i class="fa-solid fa-bell"></i> Notifications</a>
            <a href="profile.html" class="nav-item ${activePage === 'profile' ? 'active' : ''}"><i class="fa-solid fa-user"></i> Profile</a>
            <a href="#" onclick="logout()" class="nav-item mt-4 text-danger"><i class="fa-solid fa-right-from-bracket"></i> Logout</a>
        </ul>
    `;
    const sidebarRef = document.getElementById('sidebar-container');
    if (sidebarRef) sidebarRef.innerHTML = sidebarHTML;
}

// Format Dates
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}
