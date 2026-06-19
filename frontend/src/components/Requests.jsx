import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Plus, Clock, CheckCircle, AlertCircle, Wrench } from 'lucide-react';

const ROLES = { REQUESTER: 1, SUPERVISOR: 2, HELPDESK: 3, TECHNICIAN: 4, MANAGER: 5, DIRECTOR: 8 };

const STATUS_CONFIG = {
  'Open': { color: '#eab308', bg: 'rgba(234,179,8,0.12)', icon: '📝' },
  'Assigned': { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: '👷' },
  'In Progress': { color: '#a855f7', bg: 'rgba(168,85,247,0.12)', icon: '🔧' },
  'On Hold': { color: '#f97316', bg: 'rgba(249,115,22,0.12)', icon: '⏸' },
  'Completed': { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', icon: '✅' },
  'Disposal': { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: '🗑️' },
};

const PRIORITY_COLORS = {
  'Critical': '#ef4444', 'High': '#f97316', 'Medium': '#eab308', 'Low': '#22c55e'
};

const FILTER_TABS = {
  all: { label: 'All', roles: Object.values(ROLES) },
  pending: { label: '⏳ Pending Approval', roles: [ROLES.SUPERVISOR, ROLES.MANAGER, ROLES.DIRECTOR] },
  unassigned: { label: '🔍 Ready to Assign', roles: [ROLES.HELPDESK, ROLES.MANAGER, ROLES.DIRECTOR] },
  mine: { label: '👷 Assigned to Me', roles: [ROLES.TECHNICIAN] },
  in_progress: { label: '🔧 In Progress', roles: [ROLES.HELPDESK, ROLES.MANAGER, ROLES.DIRECTOR, ROLES.SUPERVISOR] },
  awaiting_closure: { label: '🔒 Awaiting Closure', roles: [ROLES.SUPERVISOR, ROLES.MANAGER, ROLES.DIRECTOR] },
  completed: { label: '✅ Completed', roles: [ROLES.HELPDESK, ROLES.MANAGER, ROLES.DIRECTOR, ROLES.SUPERVISOR] },
};

const Requests = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const roleId = user?.role_id;

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/requests');
      setRequests(res.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tabs visible to this role
  const visibleTabs = Object.entries(FILTER_TABS).filter(
    ([, cfg]) => cfg.roles.includes(roleId)
  );

  // Apply filter
  const filtered = requests.filter(req => {
    const matchesSearch =
      !search ||
      req.request_code?.toLowerCase().includes(search.toLowerCase()) ||
      req.problem_description?.toLowerCase().includes(search.toLowerCase());

    let matchesFilter = true;
    if (filter === 'pending') matchesFilter = req.status_id === 1 && !req.supervisor_approved_at;
    if (filter === 'unassigned') matchesFilter = !!req.supervisor_approved_at && req.status_id === 1;
    if (filter === 'mine') matchesFilter = req.assigned_technician_id === user?.user_id;
    if (filter === 'in_progress') matchesFilter = req.status_id === 3;
    if (filter === 'awaiting_closure') matchesFilter = req.status_id === 5 && !req.user_approved_closure_at;
    if (filter === 'completed') matchesFilter = req.status_id === 5 && !!req.user_approved_closure_at;

    return matchesSearch && matchesFilter;
  });

  // Summary counts for top cards
  const counts = {
    total: requests.length,
    open: requests.filter(r => r.status_id === 1).length,
    progress: requests.filter(r => r.status_id === 3).length,
    done: requests.filter(r => r.status_id === 5).length,
  };

  const canCreate = [ROLES.REQUESTER, ROLES.HELPDESK, ROLES.MANAGER, ROLES.DIRECTOR].includes(roleId);

  return (
    <div style={{ padding: '0' }}>

      {/* ── Page Header ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-main)' }}>Maintenance Requests</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Track and manage all maintenance requests
          </p>
        </div>
        {canCreate && (
          <Link
            to="/requests/new"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.65rem 1.25rem', backgroundColor: 'var(--primary)',
              color: 'white', textDecoration: 'none', borderRadius: '8px',
              fontWeight: '600', fontSize: '0.9rem', transition: 'opacity 0.2s'
            }}
          >
            <Plus size={16} /> New Request
          </Link>
        )}
      </div>

      {/* ── Summary tiles ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total', value: counts.total, icon: <Wrench size={18} />, color: 'var(--primary)' },
          { label: 'Open', value: counts.open, icon: <AlertCircle size={18} />, color: '#eab308' },
          { label: 'In Progress', value: counts.progress, icon: <Clock size={18} />, color: '#a855f7' },
          { label: 'Completed', value: counts.done, icon: <CheckCircle size={18} />, color: '#22c55e' },
        ].map(tile => (
          <div key={tile.label} style={{
            backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px',
            padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem'
          }}>
            <div style={{ color: tile.color, opacity: 0.9 }}>{tile.icon}</div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-main)', lineHeight: 1 }}>
                {tile.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{tile.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter tabs + search ─────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {visibleTabs.map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: '0.4rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500',
                border: filter === key ? 'none' : '1px solid var(--border)',
                backgroundColor: filter === key ? 'var(--primary)' : 'var(--surface)',
                color: filter === key ? 'white' : 'var(--text-muted)',
                transition: 'all 0.2s'
              }}
            >
              {cfg.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search requests..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '0.5rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border)',
            backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '0.875rem', width: '220px'
          }}
        />
      </div>

      {/* ── Request cards grid ───────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading requests...</div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '3rem', color: 'var(--text-muted)',
          backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)'
        }}>
          <Wrench size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <p style={{ margin: 0 }}>No requests found for this filter.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {filtered.map(req => {
            const sc = STATUS_CONFIG[req.status_name] || STATUS_CONFIG['Open'];
            const pc = PRIORITY_COLORS[req.priority_name] || 'var(--primary)';
            const needsApproval = req.status_id === 1 && !req.supervisor_approved_at;
            const readyToAssign = req.status_id === 1 && req.supervisor_approved_at;
            const needsClosure = req.status_id === 5 && !req.user_approved_closure_at;

            return (
              <div
                key={req.request_id}
                onClick={() => navigate(`/requests/${req.request_id}`)}
                style={{
                  backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px',
                  padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s',
                  borderLeft: `4px solid ${sc.color}`,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* Card top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '0.9rem' }}>{req.request_code}</span>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <span style={{
                      padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: '600',
                      backgroundColor: req.user_approved_closure_at ? 'rgba(34,197,94,0.1)' : sc.bg, 
                      color: req.user_approved_closure_at ? '#22c55e' : sc.color,
                      border: req.user_approved_closure_at ? '1px solid #22c55e40' : 'none'
                    }}>
                      {req.user_approved_closure_at ? '🔒 Closed' : `${sc.icon} ${req.status_name}`}
                    </span>
                    <span style={{
                      padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: '600',
                      backgroundColor: `${pc}20`, color: pc
                    }}>
                      {req.priority_name}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p style={{
                  margin: '0 0 0.75rem', color: 'var(--text-main)', fontSize: '0.875rem',
                  lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden'
                }}>
                  {req.problem_description}
                </p>

                {/* Meta info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {req.branch_name && <span>📍 {req.branch_name}</span>}
                  {req.category_name && <span>🏷️ {req.category_name}</span>}
                  {req.requester_name && <span>👤 {req.requester_name}</span>}
                  <span>📅 {new Date(req.request_date).toLocaleDateString()}</span>
                </div>

                {/* Technician tag */}
                {req.assigned_technician_name && (
                  <div style={{
                    marginTop: '0.75rem', padding: '0.4rem 0.75rem', borderRadius: '6px',
                    backgroundColor: 'rgba(59,130,246,0.1)', fontSize: '0.75rem', color: '#3b82f6'
                  }}>
                    👷 {req.assigned_technician_name}
                  </div>
                )}

                {/* Attention badges */}
                {needsApproval && [ROLES.SUPERVISOR, ROLES.MANAGER, ROLES.DIRECTOR].includes(roleId) && (
                  <div style={{
                    marginTop: '0.75rem', padding: '0.4rem 0.75rem', borderRadius: '6px',
                    backgroundColor: 'rgba(234,179,8,0.1)', fontSize: '0.75rem', color: '#eab308', fontWeight: '500'
                  }}>
                    ⚠️ Awaiting your approval
                  </div>
                )}
                {readyToAssign && [ROLES.HELPDESK, ROLES.MANAGER, ROLES.DIRECTOR].includes(roleId) && (
                  <div style={{
                    marginTop: '0.75rem', padding: '0.4rem 0.75rem', borderRadius: '6px',
                    backgroundColor: 'rgba(59,130,246,0.1)', fontSize: '0.75rem', color: '#3b82f6', fontWeight: '500'
                  }}>
                    🔍 Ready to assign a technician
                  </div>
                )}
                {needsClosure && [ROLES.SUPERVISOR, ROLES.MANAGER, ROLES.DIRECTOR].includes(roleId) && (
                  <div style={{
                    marginTop: '0.75rem', padding: '0.4rem 0.75rem', borderRadius: '6px',
                    backgroundColor: 'rgba(34,197,94,0.1)', fontSize: '0.75rem', color: '#22c55e', fontWeight: '500'
                  }}>
                    🔒 Awaiting closure approval
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Requests;
