import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, Wrench, User, Tag, Calendar, Loader, AlertTriangle } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLES = { REQUESTER: 1, SUPERVISOR: 2, HELPDESK: 3, TECHNICIAN: 4, MANAGER: 5, DIRECTOR: 8 };
const STATUS = { OPEN: 1, ASSIGNED: 2, IN_PROGRESS: 3, ON_HOLD: 4, COMPLETED: 5, DISPOSAL: 6 };

const STATUS_LABELS = { 1: 'Open', 2: 'Assigned', 3: 'In Progress', 4: 'On Hold', 5: 'Completed', 6: 'Disposal' };
const STATUS_COLORS = {
  1: { bg: 'rgba(234,179,8,0.15)', color: '#eab308' },
  2: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  3: { bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
  4: { bg: 'rgba(249,115,22,0.15)', color: '#f97316' },
  5: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
  6: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
};
const PRIORITY_COLORS = { Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#22c55e' };

const STEPS = [
  { label: 'Submitted', icon: '📝' },
  { label: 'Approved', icon: '✅' },
  { label: 'Assigned', icon: '👷' },
  { label: 'In Progress', icon: '🔧' },
  { label: 'Completed', icon: '🎉' },
];
function getActiveStep(req) {
  if (!req) return 0;
  if ([STATUS.COMPLETED, STATUS.DISPOSAL].includes(req.status_id)) return 4;
  if ([STATUS.IN_PROGRESS, STATUS.ON_HOLD].includes(req.status_id)) return 3;
  if (req.status_id === STATUS.ASSIGNED) return 2;
  if (req.supervisor_approved_at) return 1;
  return 0;
}

// ─── Shared style helpers ─────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '0.65rem 0.8rem', borderRadius: '7px',
  border: '1px solid var(--border)', backgroundColor: 'var(--bg-color)',
  color: 'var(--text-main)', fontSize: '0.875rem', boxSizing: 'border-box'
};
const btnStyle = (color, disabled = false) => ({
  width: '100%', padding: '0.7rem', border: 'none', borderRadius: '8px',
  backgroundColor: disabled ? 'var(--border)' : color,
  color: disabled ? 'var(--text-muted)' : 'white',
  fontWeight: '600', fontSize: '0.875rem',
  cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1
});
const fieldStyle = { display: 'flex', flexDirection: 'column', gap: '0.3rem' };
const labelStyle = { fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' };

// ─── Sub-components ───────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{value || '—'}</span>
    </div>
  );
}
function StatusBadge({ statusId }) {
  const s = STATUS_COLORS[statusId] || {};
  return (
    <span style={{ padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: s.bg, color: s.color, border: `1px solid ${s.color}40` }}>
      {STATUS_LABELS[statusId] || 'Unknown'}
    </span>
  );
}
function ActionCard({ title, color = 'var(--primary)', children }) {
  return (
    <div style={{ backgroundColor: 'var(--surface)', border: `1px solid ${color}30`, borderRadius: '10px', padding: '1.25rem', borderLeft: `4px solid ${color}` }}>
      <h3 style={{ margin: '0 0 1rem', color, fontSize: '0.9rem' }}>{title}</h3>
      {children}
    </div>
  );
}
function SectionCard({ title, icon, children }) {
  return (
    <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.25rem' }}>
      <h3 style={{ margin: '0 0 1rem', color: 'var(--text-main)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const roleId = user?.role_id;

  const [request, setRequest] = useState(null);
  const [lookups, setLookups] = useState({ technicians: [], hold_reasons: [], party_types: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  // Assignment
  const [selectedTech, setSelectedTech] = useState('');

  // Status update (In Progress / Completed)
  const [activeAction, setActiveAction] = useState(null); // 'inprogress'|'hold'|'complete'|'disposal'

  // On Hold form
  const [holdForm, setHoldForm] = useState({ reason_id: '', responsible_party_id: '', expected_resume_date: '', remarks: '' });

  // Completion / Resolution form
  const [resForm, setResForm] = useState({ resolution_summary: '', hardware_type: '', serial_number: '', tag_number: '', cost_saved: '' });

  // Disposal form
  const [dispForm, setDispForm] = useState({ reason_for_disposal: '', asset_condition: '', recommendation: '' });

  const fetchRequest = async () => {
    try {
      const res = await api.get(`/requests/${id}`);
      setRequest(res.data);
    } catch { setToast({ type: 'error', text: 'Failed to load request.' }); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchRequest();
    api.get('/lookups').then(r => setLookups(r.data)).catch(console.error);
  }, [id]);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const withBusy = async (fn, successMsg) => {
    setBusy(true);
    try {
      await fn();
      showToast('success', successMsg);
      setActiveAction(null);
      await fetchRequest();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Action failed.');
    } finally { setBusy(false); }
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleApprove = () => withBusy(() => api.patch(`/requests/${id}/approve`), '✅ Request approved!');
  const handleApproveClosure = () => withBusy(() => api.patch(`/requests/${id}/close`), '🔒 Closure approved!');
  const handleResume = () => withBusy(() => api.patch(`/requests/${id}/resume`), '▶ Request resumed — In Progress');
  const handleApproveDisp = () => withBusy(() => api.patch(`/requests/${id}/disposal/approve`), '✅ Disposal approved!');

  const handleAssign = () => {
    if (!selectedTech) return showToast('error', 'Please select a technician.');
    withBusy(() => api.patch(`/requests/${id}/assign`, { technician_id: parseInt(selectedTech) }), '👷 Assigned successfully!');
  };

  const handleMarkInProgress = () =>
    withBusy(() => api.patch(`/requests/${id}/status`, { status_id: STATUS.IN_PROGRESS }), '🔧 Marked as In Progress!');

  const handleHoldSubmit = () => {
    if (!holdForm.reason_id) return showToast('error', 'Please select a hold reason.');
    withBusy(() => api.post(`/requests/${id}/hold`, holdForm), '⏸ Request put on hold.');
  };

  const handleCompleteSubmit = () => {
    if (!resForm.resolution_summary) return showToast('error', 'Resolution summary is required.');
    withBusy(
      () => api.patch(`/requests/${id}/status`, { status_id: STATUS.COMPLETED, resolution_details: resForm }),
      '🎉 Request marked as Completed!'
    );
  };

  const handleDisposalSubmit = () => {
    if (!dispForm.reason_for_disposal) return showToast('error', 'Reason for disposal is required.');
    withBusy(() => api.post(`/requests/${id}/disposal`, dispForm), '🗑 Disposal request submitted!');
  };

  // ── Permissions ──────────────────────────────────────────────────────────────
  if (!request && !loading) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
      <AlertTriangle size={40} style={{ opacity: 0.4, marginBottom: '1rem' }} />
      <p>Request not found.</p>
      <button onClick={() => navigate('/requests')} style={btnStyle('var(--primary)')}>Back</button>
    </div>
  );

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '0.75rem', color: 'var(--text-muted)' }}>
      <Loader size={22} /> Loading…
    </div>
  );

  const canApprove = [ROLES.SUPERVISOR, ROLES.MANAGER, ROLES.DIRECTOR].includes(roleId) && request.status_id === STATUS.OPEN && !request.supervisor_approved_at;
  const canAssign = [ROLES.HELPDESK, ROLES.MANAGER, ROLES.DIRECTOR].includes(roleId) && request.supervisor_approved_at && ![STATUS.COMPLETED, STATUS.DISPOSAL].includes(request.status_id);
  const isMyAssigned = roleId === ROLES.TECHNICIAN && request.assigned_technician_id === user?.user_id;
  const canWork = (isMyAssigned || [ROLES.HELPDESK, ROLES.MANAGER, ROLES.DIRECTOR].includes(roleId)) && [STATUS.ASSIGNED, STATUS.IN_PROGRESS].includes(request.status_id);
  const canResume = (isMyAssigned || [ROLES.HELPDESK, ROLES.MANAGER, ROLES.DIRECTOR].includes(roleId)) && request.status_id === STATUS.ON_HOLD;
  const canApproveDisposal = [ROLES.MANAGER, ROLES.DIRECTOR].includes(roleId) && request.status_id === STATUS.DISPOSAL;
  const canApproveClosure = [ROLES.SUPERVISOR].includes(roleId) && request.status_id === STATUS.COMPLETED && !request.user_approved_closure_at;

  const activeStep = getActiveStep(request);
  const pc = PRIORITY_COLORS[request.priority_name] || 'var(--primary)';

  // Latest hold record
  const latestHold = request.on_hold_details?.[0];
  // Latest disposal
  const latestDisposal = request.disposal_details?.[0];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/requests')} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          <ArrowLeft size={15} /> Back
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{request.request_code}</h1>
            <StatusBadge statusId={request.status_id} />
            <span style={{ padding: '0.25rem 0.7rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: `${pc}20`, color: pc, border: `1px solid ${pc}40` }}>
              {request.priority_name}
            </span>
          </div>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Created {new Date(request.request_date).toLocaleString()}
          </p>
        </div>
      </div>

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          marginBottom: '1rem', padding: '0.85rem 1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '500',
          backgroundColor: toast.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${toast.type === 'success' ? '#22c55e' : '#ef4444'}40`,
          color: toast.type === 'success' ? '#22c55e' : '#ef4444'
        }}>
          {toast.text}
        </div>
      )}

      {/* ── Progress Stepper ───────────────────────────────────────────────── */}
      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '20px', left: '8%', right: '8%', height: '2px', backgroundColor: 'var(--border)', zIndex: 0 }} />
          <div style={{ position: 'absolute', top: '20px', left: '8%', height: '2px', zIndex: 1, backgroundColor: 'var(--primary)', width: `${Math.min(activeStep / (STEPS.length - 1) * 84, 84)}%`, transition: 'width 0.5s ease' }} />
          {STEPS.map((step, i) => {
            const done = i < activeStep;
            const active = i === activeStep;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', zIndex: 2 }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: done ? '1rem' : '0.85rem',
                  backgroundColor: (done || active) ? 'var(--primary)' : 'var(--bg-color)',
                  border: `2px solid ${(done || active) ? 'var(--primary)' : 'var(--border)'}`,
                  boxShadow: active ? '0 0 0 4px rgba(59,130,246,0.2)' : 'none', transition: 'all 0.3s'
                }}>
                  {done ? '✓' : step.icon}
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: active ? '700' : '400', color: (done || active) ? 'var(--text-main)' : 'var(--text-muted)', textAlign: 'center' }}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Timeline labels */}
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', flexWrap: 'wrap', fontSize: '0.72rem' }}>
          {request.supervisor_approved_at
            ? <span style={{ color: '#22c55e' }}>✅ Approved by <strong>{request.supervisor_name}</strong> · {new Date(request.supervisor_approved_at).toLocaleString()}</span>
            : <span style={{ color: 'var(--text-muted)' }}>⏳ Awaiting supervisor approval</span>}
          {request.assigned_technician_name && (
            <span style={{ color: '#3b82f6' }}>👷 Assigned to <strong>{request.assigned_technician_name}</strong> · {new Date(request.assigned_at).toLocaleString()}</span>
          )}
          {request.completion_date && (
            <span style={{ color: '#22c55e' }}>🎉 Completed · {new Date(request.completion_date).toLocaleString()}</span>
          )}
          {request.user_approved_closure_at && (
            <span style={{ color: '#22c55e' }}>🔒 Closed · {new Date(request.user_approved_closure_at).toLocaleString()}</span>
          )}
        </div>
      </div>

      {/* ── Body: two columns ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Problem Description */}
          <SectionCard title="Problem Description" icon={<Wrench size={15} />}>
            <p style={{ margin: 0, lineHeight: '1.6', color: 'var(--text-main)', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
              {request.problem_description}
            </p>
          </SectionCard>

          {/* Asset & Location */}
          <SectionCard title="Asset & Location" icon={<Tag size={15} />}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <InfoRow label="Category" value={request.category_name} />
              <InfoRow label="Asset Tag" value={request.asset_tag} />
              <InfoRow label="Brand/Model" value={[request.asset_brand, request.asset_model].filter(Boolean).join(' ') || null} />
              <InfoRow label="Serial No." value={request.asset_serial} />
              <InfoRow label="Branch" value={request.branch_name} />
              <InfoRow label="District" value={request.district} />
            </div>
          </SectionCard>

          {/* Category-specific maintenance details (read-only) */}
          {request.hardware_details && (
            <SectionCard title="🖥️ Hardware Details" icon="">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <InfoRow label="Hardware Type" value={request.hardware_details.hardware_type} />
                <InfoRow label="Brand" value={request.hardware_details.brand} />
                <InfoRow label="Model" value={request.hardware_details.model} />
                <InfoRow label="Serial No." value={request.hardware_details.serial_number} />
                <InfoRow label="Tag No." value={request.hardware_details.tag_number} />
                <InfoRow label="Quantity" value={request.hardware_details.quantity} />
                <InfoRow label="IP Address" value={request.hardware_details.ip_address} />
              </div>
            </SectionCard>
          )}

          {request.generator_details && (
            <SectionCard title="⚡ Generator Details" icon="">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <InfoRow label="Category" value={request.generator_details.generator_category} />
                <InfoRow label="Brand" value={request.generator_details.brand} />
                <InfoRow label="Model" value={request.generator_details.model} />
                <InfoRow label="Engine S/N" value={request.generator_details.engine_serial_number} />
                <InfoRow label="Engine Model" value={request.generator_details.engine_model} />
                <InfoRow label="Tag No." value={request.generator_details.tag_number} />
                <InfoRow label="Running Hrs" value={request.generator_details.engine_running_hours != null ? `${request.generator_details.engine_running_hours} hrs` : null} />
              </div>
            </SectionCard>
          )}

          {request.electrical_details && (
            <SectionCard title="🔌 Electrical Details" icon="">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <InfoRow label="Maint. Type" value={request.electrical_details.maintenance_type} />
                <InfoRow label="Sub Category" value={request.electrical_details.sub_category} />
                <InfoRow label="Model" value={request.electrical_details.model} />
                <InfoRow label="Serial No." value={request.electrical_details.serial_number} />
                <InfoRow label="Tag No." value={request.electrical_details.tag_number} />
                <InfoRow label="Quantity" value={request.electrical_details.quantity} />
              </div>
            </SectionCard>
          )}

          {/* Resolution details (completed) */}
          {request.resolution_details && (
            <SectionCard title="🎉 Resolution Summary" icon="">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <span style={labelStyle}>What was done</span>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                    {request.resolution_details.resolution_summary}
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <InfoRow label="Resolved By" value={request.resolution_details.users?.full_name} />
                  <InfoRow label="Cost Saved" value={request.resolution_details.cost_saved ? `$${request.resolution_details.cost_saved}` : null} />
                  <InfoRow label="Hardware Type" value={request.resolution_details.hardware_type} />
                  <InfoRow label="Serial No." value={request.resolution_details.serial_number} />
                </div>
              </div>
            </SectionCard>
          )}

          {/* Dates */}
          <SectionCard title="Dates" icon={<Calendar size={15} />}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <InfoRow label="Created" value={new Date(request.request_date).toLocaleDateString()} />
              <InfoRow label="Due Date" value={request.due_date ? new Date(request.due_date).toLocaleDateString() : null} />
              <InfoRow label="Completed" value={request.completion_date ? new Date(request.completion_date).toLocaleDateString() : null} />
              <InfoRow label="Closed" value={request.user_approved_closure_at ? new Date(request.user_approved_closure_at).toLocaleDateString() : null} />
            </div>
          </SectionCard>
        </div>

        {/* RIGHT COLUMN — People + Action Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* People */}
          <SectionCard title="People" icon={<User size={15} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <InfoRow label="Requested By" value={request.requester_name} />
              <InfoRow label="Supervisor" value={request.supervisor_name || 'Not yet approved'} />
              <InfoRow label="Assigned To" value={request.assigned_technician_name || 'Not yet assigned'} />
              <InfoRow label="Assigned By" value={request.assigned_by_name} />
            </div>
          </SectionCard>

          {/* ── SUPERVISOR: Approve ────────────────────────────────────────── */}
          {canApprove && (
            <ActionCard title="🔐 Supervisor Approval" color="#22c55e">
              <p style={{ margin: '0 0 0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                This request is waiting for your approval before the Helpdesk can assign a technician.
              </p>
              <button onClick={handleApprove} disabled={busy} style={btnStyle('#22c55e', busy)}>
                {busy ? '⏳ Processing…' : '✅ Approve Request'}
              </button>
            </ActionCard>
          )}

          {/* ── SUPERVISOR / MANAGER: Approve Closure ─────────────────────── */}
          {canApproveClosure && (
            <ActionCard title="🔒 Approve Closure" color="#22c55e">
              <p style={{ margin: '0 0 0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                The technician has completed the work. Please verify and approve the closure of this request.
              </p>
              <button onClick={handleApproveClosure} disabled={busy} style={btnStyle('#22c55e', busy)}>
                {busy ? '⏳ Processing…' : '🔒 Approve Closure'}
              </button>
            </ActionCard>
          )}

          {/* ── HELPDESK / MANAGER: Assign Technician ─────────────────────── */}
          {canAssign && (
            <ActionCard title="👷 Assign Technician" color="#3b82f6">
              {request.assigned_technician_name && (
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', color: '#3b82f6' }}>
                  Currently: <strong>{request.assigned_technician_name}</strong>. Reassign below.
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <select value={selectedTech} onChange={e => setSelectedTech(e.target.value)} style={inputStyle}>
                  <option value="">— Select Technician —</option>
                  {(lookups.technicians || []).map(t => (
                    <option key={t.user_id} value={t.user_id}>{t.full_name}</option>
                  ))}
                </select>
                <button onClick={handleAssign} disabled={busy || !selectedTech} style={btnStyle('#3b82f6', busy || !selectedTech)}>
                  {busy ? '⏳ Assigning…' : '👷 Assign'}
                </button>
              </div>
            </ActionCard>
          )}

          {/* ── ON HOLD: Info card + Resume ───────────────────────────────── */}
          {request.status_id === STATUS.ON_HOLD && latestHold && (
            <ActionCard title="⏸ Currently On Hold" color="#f97316">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
                <InfoRow label="Reason" value={latestHold.on_hold_reasons?.reason_text} />
                <InfoRow label="Responsible Party" value={latestHold.responsible_party_types?.party_name} />
                <InfoRow label="Expected Resume" value={latestHold.expected_resume_date ? new Date(latestHold.expected_resume_date).toLocaleDateString() : null} />
                {latestHold.remarks && <InfoRow label="Remarks" value={latestHold.remarks} />}
                <InfoRow label="Recorded By" value={latestHold.users?.full_name} />
                <InfoRow label="Hold Started" value={new Date(latestHold.hold_start_date).toLocaleString()} />
              </div>
              {canResume && (
                <button onClick={handleResume} disabled={busy} style={btnStyle('#22c55e', busy)}>
                  {busy ? '⏳…' : '▶ Resume Work'}
                </button>
              )}
            </ActionCard>
          )}

          {/* ── DISPOSAL: Info card + Approve ────────────────────────────── */}
          {request.status_id === STATUS.DISPOSAL && latestDisposal && (
            <ActionCard title="🗑 Disposal Request" color="#ef4444">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
                <InfoRow label="Reason" value={latestDisposal.reason_for_disposal} />
                <InfoRow label="Asset Condition" value={latestDisposal.asset_condition} />
                <InfoRow label="Recommendation" value={latestDisposal.recommendation} />
                <InfoRow label="Checked By" value={latestDisposal.users_request_disposal_details_checked_by_user_idTousers?.full_name} />
                {latestDisposal.approved_at ? (
                  <div style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e', fontSize: '0.8rem', fontWeight: '500' }}>
                    ✅ Approved by {latestDisposal.users_request_disposal_details_approved_by_user_idTousers?.full_name} · {new Date(latestDisposal.approved_at).toLocaleString()}
                  </div>
                ) : (
                  <div style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', backgroundColor: 'rgba(249,115,22,0.1)', color: '#f97316', fontSize: '0.8rem' }}>
                    ⏳ Awaiting management approval
                  </div>
                )}
              </div>
              {canApproveDisposal && !latestDisposal.approved_at && (
                <button onClick={handleApproveDisp} disabled={busy} style={btnStyle('#ef4444', busy)}>
                  {busy ? '⏳…' : '✅ Approve Disposal'}
                </button>
              )}
            </ActionCard>
          )}

          {/* ── TECHNICIAN / HELPDESK: Work Actions ──────────────────────── */}
          {canWork && (
            <ActionCard title="🔧 Work Actions" color="#a855f7">

              {/* Action selector buttons */}
              {!activeAction && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {request.status_id === STATUS.ASSIGNED && (
                    <button onClick={handleMarkInProgress} disabled={busy} style={{ ...btnStyle('#a855f7', busy) }}>
                      {busy ? '⏳…' : '▶ Mark as In Progress'}
                    </button>
                  )}
                  <button onClick={() => setActiveAction('hold')} style={{ ...btnStyle('#f97316'), backgroundColor: 'rgba(249,115,22,0.1)', color: '#f97316', border: '1px solid #f9731640' }}>
                    ⏸ Put On Hold
                  </button>
                  <button onClick={() => setActiveAction('complete')} style={{ ...btnStyle('#22c55e'), backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid #22c55e40' }}>
                    ✅ Mark Completed
                  </button>
                  {request.asset_id && (
                    <button onClick={() => setActiveAction('disposal')} style={{ ...btnStyle('#ef4444'), backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid #ef444440' }}>
                      🗑 Request Disposal
                    </button>
                  )}
                </div>
              )}

              {/* ON HOLD FORM */}
              {activeAction === 'hold' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Why is this request being put on hold?</p>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>Reason *</label>
                    <select value={holdForm.reason_id} onChange={e => setHoldForm(p => ({ ...p, reason_id: e.target.value }))} style={inputStyle}>
                      <option value="">— Select Reason —</option>
                      {(lookups.hold_reasons || []).map(r => <option key={r.reason_id} value={r.reason_id}>{r.reason_text}</option>)}
                    </select>
                  </div>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>Responsible Party</label>
                    <select value={holdForm.responsible_party_id} onChange={e => setHoldForm(p => ({ ...p, responsible_party_id: e.target.value }))} style={inputStyle}>
                      <option value="">— Select Party (optional) —</option>
                      {(lookups.party_types || []).map(p => <option key={p.party_type_id} value={p.party_type_id}>{p.party_name}</option>)}
                    </select>
                  </div>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>Expected Resume Date</label>
                    <input type="date" value={holdForm.expected_resume_date} onChange={e => setHoldForm(p => ({ ...p, expected_resume_date: e.target.value }))} style={inputStyle} />
                  </div>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>Remarks</label>
                    <textarea rows={2} value={holdForm.remarks} onChange={e => setHoldForm(p => ({ ...p, remarks: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Optional notes…" />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setActiveAction(null)} style={{ flex: 1, ...btnStyle('var(--border)'), backgroundColor: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Cancel</button>
                    <button onClick={handleHoldSubmit} disabled={busy} style={{ flex: 2, ...btnStyle('#f97316', busy) }}>
                      {busy ? '⏳…' : '⏸ Confirm Hold'}
                    </button>
                  </div>
                </div>
              )}

              {/* COMPLETED / RESOLUTION FORM */}
              {activeAction === 'complete' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Describe what was done to resolve this request.</p>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>Resolution Summary *</label>
                    <textarea rows={3} value={resForm.resolution_summary} onChange={e => setResForm(p => ({ ...p, resolution_summary: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} placeholder="What was done to fix the issue?" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Hardware Replaced</label>
                      <input value={resForm.hardware_type} onChange={e => setResForm(p => ({ ...p, hardware_type: e.target.value }))} style={inputStyle} placeholder="e.g. RAM, HDD" />
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Cost</label>
                      <input value={resForm.serial_number} onChange={e => setResForm(p => ({ ...p, serial_number: e.target.value }))} style={inputStyle} />
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>...</label>
                      <input value={resForm.tag_number} onChange={e => setResForm(p => ({ ...p, tag_number: e.target.value }))} style={inputStyle} />
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Cost Saved ($)</label>
                      <input type="number" step="0.01" value={resForm.cost_saved} onChange={e => setResForm(p => ({ ...p, cost_saved: e.target.value }))} style={inputStyle} placeholder="0.00" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setActiveAction(null)} style={{ flex: 1, ...btnStyle('var(--border)'), backgroundColor: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Cancel</button>
                    <button onClick={handleCompleteSubmit} disabled={busy} style={{ flex: 2, ...btnStyle('#22c55e', busy) }}>
                      {busy ? '⏳…' : '🎉 Mark Completed'}
                    </button>
                  </div>
                </div>
              )}

              {/* DISPOSAL FORM */}
              {activeAction === 'disposal' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Submit a disposal request for the asset. This will require management approval.</p>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>Reason for Disposal *</label>
                    <textarea rows={2} value={dispForm.reason_for_disposal} onChange={e => setDispForm(p => ({ ...p, reason_for_disposal: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Why should this asset be disposed?" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Asset Condition</label>
                      <select value={dispForm.asset_condition} onChange={e => setDispForm(p => ({ ...p, asset_condition: e.target.value }))} style={inputStyle}>
                        <option value="">— Select —</option>
                        {['Functional', 'Partially Functional', 'Non-Functional', 'Beyond Repair'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Recommendation</label>
                      <select value={dispForm.recommendation} onChange={e => setDispForm(p => ({ ...p, recommendation: e.target.value }))} style={inputStyle}>
                        <option value="">— Select —</option>
                        {['Replace', 'Dispose', 'Return to Vendor', 'Write Off'].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setActiveAction(null)} style={{ flex: 1, ...btnStyle('var(--border)'), backgroundColor: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Cancel</button>
                    <button onClick={handleDisposalSubmit} disabled={busy} style={{ flex: 2, ...btnStyle('#ef4444', busy) }}>
                      {busy ? '⏳…' : '🗑 Submit Disposal'}
                    </button>
                  </div>
                </div>
              )}
            </ActionCard>
          )}

          {/* ── REQUESTER: Status info panel ─────────────────────────────── */}
          {roleId === ROLES.REQUESTER && (
            <ActionCard title="📋 Your Request Status" color="var(--primary)">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status</span>
                  <StatusBadge statusId={request.status_id} />
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  {request.status_id === STATUS.OPEN && !request.supervisor_approved_at && '⏳ Waiting for supervisor approval.'}
                  {request.status_id === STATUS.OPEN && request.supervisor_approved_at && '✅ Approved. Waiting for Helpdesk to assign a technician.'}
                  {request.status_id === STATUS.ASSIGNED && '👷 A technician has been assigned and will begin work soon.'}
                  {request.status_id === STATUS.IN_PROGRESS && `🔧 ${request.assigned_technician_name} is actively working on this.`}
                  {request.status_id === STATUS.ON_HOLD && '⏸ Work is paused. Check the on-hold details for the reason.'}
                  {request.status_id === STATUS.COMPLETED && '🎉 Your request has been completed!'}
                  {request.status_id === STATUS.DISPOSAL && '🗑 An asset disposal has been requested and is pending approval.'}
                </p>
              </div>
            </ActionCard>
          )}

        </div>{/* end right column */}
      </div>
    </div>
  );
};

export default RequestDetail;
