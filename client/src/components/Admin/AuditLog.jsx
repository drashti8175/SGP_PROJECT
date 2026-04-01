import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw } from 'lucide-react';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);

  const loadLogs = () => {
    // Collect from sessionStorage (set by auditLog() calls across modules)
    const stored = JSON.parse(sessionStorage.getItem('auditLogs') || '[]');
    // Add some system logs for demo
    const systemLogs = JSON.parse(localStorage.getItem('systemAuditLogs') || '[]');
    setLogs([...stored, ...systemLogs].slice(0, 50));
  };

  useEffect(() => { loadLogs(); }, []);

  const clearLogs = () => {
    sessionStorage.removeItem('auditLogs');
    localStorage.removeItem('systemAuditLogs');
    setLogs([]);
  };

  const actionColor = (action) => {
    if (action.includes('Called') || action.includes('Completed')) return '#10b981';
    if (action.includes('Cancelled') || action.includes('Deleted') || action.includes('No-show')) return '#ef4444';
    if (action.includes('Prescription') || action.includes('Saved')) return '#2563eb';
    if (action.includes('Approved') || action.includes('Confirmed')) return '#10b981';
    return '#64748b';
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Shield size={22} /> Audit Log</h1>
          <p className="page-sub">Track all system actions and changes</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={loadLogs}><RefreshCw size={15} /> Refresh</button>
          <button className="btn btn-danger" onClick={clearLogs}>Clear Logs</button>
        </div>
      </div>

      <div className="card">
        {logs.length === 0 ? (
          <div className="empty-state">
            <Shield size={48} />
            <p>No audit logs yet</p>
            <p className="text-muted text-sm">Actions performed by doctors and staff will appear here</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Time</th><th>Action</th><th>Module</th></tr></thead>
            <tbody>
              {logs.map((l, i) => (
                <tr key={i}>
                  <td className="text-muted text-sm fw-600">{l.time}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: actionColor(l.action), flexShrink: 0 }} />
                      {l.action}
                    </div>
                  </td>
                  <td><span className="badge badge-info">{l.module || 'System'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
