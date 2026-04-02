import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { Users, Trash2, RefreshCw, Search } from 'lucide-react';

const roleBadge = r => {
  if (r === 'admin') return 'badge-danger';
  if (r === 'doctor') return 'badge-info';
  if (r === 'receptionist') return 'badge-warning';
  return 'badge-success';
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  const fetchData = () => adminService.getUsers().then(setUsers).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { fetchData(); }, []);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const deleteUser = async (id, name) => {
    if (!confirm(`Delete user ${name}?`)) return;
    await adminService.deleteUser(id);
    notify(`✅ ${name} deleted`);
    fetchData();
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.includes(q);
  });

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Users size={22} /> Staff & User Management</h1>
          <p className="page-sub">{users.length} total users</p>
        </div>
        <div className="header-actions">
          {toast && <span className="action-toast">{toast}</span>}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="search-input" style={{ paddingLeft: 32 }} placeholder="Search users..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-outline" onClick={fetchData}><RefreshCw size={15} /></button>
        </div>
      </div>

      {/* Role Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {['patient','doctor','receptionist','admin'].map(role => (
          <div key={role} className="stat-card">
            <div className="stat-icon"><Users size={18} /></div>
            <div>
              <p className="stat-label">{role.charAt(0).toUpperCase() + role.slice(1)}s</p>
              <h2 className="stat-value">{users.filter(u => u.role === role).length}</h2>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u._id}>
                <td>
                  <div className="patient-cell">
                    <div className="patient-avatar">{u.name?.charAt(0)}</div>
                    <span className="fw-600">{u.name}</span>
                  </div>
                </td>
                <td className="text-muted">{u.email}</td>
                <td>
                  <span className={`badge ${roleBadge(u.role)}`} style={{ textTransform: 'capitalize' }}>
                    {u.role}
                  </span>
                </td>
                <td className="text-muted text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <button className="btn btn-xs btn-danger" onClick={() => deleteUser(u._id, u.name)}>
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty-state"><Users size={40} /><p>No users found</p></div>}
      </div>
    </div>
  );
}
