import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { Stethoscope, LogOut } from 'lucide-react';

export default function Sidebar({ items, role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColors = {
    doctor: '#2563eb',
    patient: '#0891b2',
    receptionist: '#7c3aed',
    admin: '#dc2626',
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-icon" style={{ background: roleColors[role] || '#2563eb' }}>
          <Stethoscope size={20} />
        </div>
        <div>
          <h2>MediCore</h2>
          <span className="role-badge" style={{ background: `${roleColors[role]}20`, color: roleColors[role] }}>
            {role?.charAt(0).toUpperCase() + role?.slice(1)}
          </span>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar" style={{ background: roleColors[role] || '#2563eb' }}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="user-name">{user?.name}</p>
          <p className="user-email">{user?.email}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={({ isActive }) => isActive ? { background: roleColors[role], color: 'white' } : {}}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <button className="logout-btn" onClick={handleLogout}>
        <LogOut size={18} />
        <span>Logout</span>
      </button>
    </aside>
  );
}
