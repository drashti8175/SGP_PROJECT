import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { Users } from 'lucide-react';

const roleBadge = (r) => {
  if (r === 'admin') return 'badge-danger';
  if (r === 'doctor') return 'badge-info';
  if (r === 'receptionist') return 'badge-warning';
  return 'badge-success';
};

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { adminService.getUsers().then(data => { setUsers(data); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const filtered = users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="page-loading">Loading users...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Users size={22} /> All Users</h1>
          <p className="page-sub">{users.length} registered users</p>
        </div>
        <input className="search-input" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
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
                <td><span className={`badge ${roleBadge(u.role)}`}>{u.role}</span></td>
                <td className="text-muted text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty-state"><Users size={40} /><p>No users found</p></div>}
      </div>
    </div>
  );
}
