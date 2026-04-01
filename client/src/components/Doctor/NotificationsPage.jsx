import React, { useState, useEffect } from 'react';
import { doctorService, socket } from '../../services/api';
import { Bell, RefreshCw, CheckCircle, AlertCircle, Clock, Calendar, XCircle, CheckCircle2 } from 'lucide-react';

const ALERT_CONFIG = {
  emergency: { icon: '🚨', color: '#dc2626', bg: '#fee2e2', label: 'Emergency' },
  noshow:    { icon: '🚫', color: '#f59e0b', bg: '#fef3c7', label: 'No-Show' },
  waiting:   { icon: '⏳', color: '#0891b2', bg: '#cffafe', label: 'Waiting' },
  completed: { icon: '✅', color: '#10b981', bg: '#d1fae5', label: 'Completed' },
  followup:  { icon: '📅', color: '#7c3aed', bg: '#ede9fe', label: 'Follow-up' },
  overdue:   { icon: '⚠️', color: '#dc2626', bg: '#fee2e2', label: 'Overdue' },
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [readIds, setReadIds] = useState(new Set());

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const data = await doctorService.getNotifications();
      setNotifs(data);
    } catch (e) {
      setNotifs([]);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchNotifs();
    socket.on('queue_updated', fetchNotifs);
    socket.on('appointment_updated', fetchNotifs);
    return () => {
      socket.off('queue_updated', fetchNotifs);
      socket.off('appointment_updated', fetchNotifs);
    };
  }, []);

  const markRead = (i) => setReadIds(s => new Set([...s, i]));
  const markAllRead = () => setReadIds(new Set(notifs.map((_, i) => i)));

  const filtered = filter === 'all' ? notifs
    : filter === 'unread' ? notifs.filter((n, i) => !n.is_read && !readIds.has(i))
    : notifs.filter(n => n.type === filter);

  const unreadCount = notifs.filter((n, i) => !n.is_read && !readIds.has(i)).length;

  const formatTime = (t) => {
    if (!t) return '';
    const d = new Date(t);
    const now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Bell size={22} /> Alerts & Notifications
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </h1>
          <p className="page-sub">Real-time alerts from your patient queue</p>
        </div>
        <div className="header-actions">
          {unreadCount > 0 && (
            <button className="btn btn-outline" onClick={markAllRead}>
              <CheckCircle2 size={15} /> Mark All Read
            </button>
          )}
          <button className="btn btn-outline" onClick={fetchNotifs} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="notif-summary-row">
        {Object.entries(ALERT_CONFIG).map(([key, cfg]) => {
          const count = notifs.filter(n => n.type === key).length;
          return (
            <div key={key} className="notif-summary-card" style={{ borderColor: cfg.color, background: cfg.bg }}
              onClick={() => setFilter(filter === key ? 'all' : key)}>
              <span style={{ fontSize: 20 }}>{cfg.icon}</span>
              <div>
                <p className="fw-700" style={{ color: cfg.color }}>{count}</p>
                <p className="text-xs" style={{ color: cfg.color }}>{cfg.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          All ({notifs.length})
        </button>
        <button className={`filter-tab ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>
          Unread ({unreadCount})
        </button>
        {['emergency','followup','overdue','waiting','noshow'].map(t => (
          <button key={t} className={`filter-tab ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>
            {ALERT_CONFIG[t].icon} {ALERT_CONFIG[t].label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="page-loading"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: 48 }}>
            <Bell size={48} style={{ opacity: 0.2 }} />
            <h3>No {filter === 'all' ? '' : filter} alerts</h3>
            <p className="text-muted text-sm">
              {filter === 'all'
                ? 'Alerts will appear here when patients book, arrive, or need follow-up.'
                : `No ${filter} alerts at this time.`}
            </p>
          </div>
        ) : (
          <div className="notif-list">
            {filtered.map((n, i) => {
              const cfg = ALERT_CONFIG[n.type] || ALERT_CONFIG.waiting;
              const isRead = n.is_read || readIds.has(i);
              return (
                <div key={i} className={`notif-item-new ${isRead ? 'notif-read' : 'notif-unread'}`}
                  onClick={() => markRead(i)}>
                  <div className="notif-icon-wrap" style={{ background: cfg.bg }}>
                    <span style={{ fontSize: 18 }}>{cfg.icon}</span>
                  </div>
                  <div className="notif-content">
                    <p className={`notif-msg ${!isRead ? 'fw-600' : ''}`}>{n.message}</p>
                    <div className="notif-meta">
                      <span className="notif-type-badge" style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                      <span className="text-muted text-xs">{formatTime(n.time)}</span>
                    </div>
                  </div>
                  {!isRead && <div className="notif-dot" />}
                  {isRead && <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
