import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Check, X, ClipboardList, User } from 'lucide-react';

const PMApprovals = () => {
  const { user } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [supervisorNotes, setSupervisorNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/pm/logs');
      setLogs(res.data);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (log) => {
    setSelectedLog(log);
    setSupervisorNotes('');
    setShowApprovalModal(true);
  };

  const submitApproval = async (status) => {
    setIsSubmitting(true);
    try {
      await api.put(`/pm/logs/${selectedLog.log_id}/approve`, {
        status, supervisor_notes: supervisorNotes
      });
      setShowApprovalModal(false);
      fetchLogs();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update approval');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter out logs that aren't pending if we just want to show action items
  // Alternatively, we can show all and color code them. Let's show all but highlight pending.

  return (
    <div style={{ padding: '0' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-main)' }}>Preventive Maintenance Approvals</h1>
        <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Review and approve PM work performed by technicians.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading PM logs...</div>
      ) : logs.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <ClipboardList size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <p style={{ margin: 0 }}>No PM work logs found for your branch.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {logs.map(log => {
            const isPending = log.status === 'Pending Approval';
            const statusColor = isPending ? '#eab308' : log.status === 'Approved' ? '#22c55e' : '#ef4444';
            const schedule = log.preventive_maintenance_schedules || {};
            const branch = schedule.branches?.branch_name || 'Unknown Branch';
            const tag = schedule.assets?.tag_number || 'Unknown Asset';

            return (
              <div key={log.log_id} style={{
                backgroundColor: 'var(--surface)', border: `1px solid ${isPending ? '#eab30850' : 'var(--border)'}`,
                borderRadius: '12px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', borderLeft: `4px solid ${statusColor}`
              }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-main)' }}>
                      {schedule.schedule_name}
                    </span>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: '600', backgroundColor: `${statusColor}20`, color: statusColor }}>
                      {log.status || 'Pending Approval'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', gap: '1rem' }}>
                    <span>📍 {branch}</span>
                    <span>⚙️ {tag}</span>
                    <span>📅 Performed: {new Date(log.performed_date).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <User size={14} /> <strong>{log.users_preventive_maintenance_logs_performed_by_user_idTousers?.full_name}</strong>: "{log.notes}"
                  </div>
                </div>

                {isPending && (
                  <button
                    onClick={() => handleAction(log)}
                    style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Review
                  </button>
                )}
                {!isPending && log.users_preventive_maintenance_logs_supervisor_user_idTousers && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                    Reviewed by <strong>{log.users_preventive_maintenance_logs_supervisor_user_idTousers.full_name}</strong>
                    <br/>
                    {log.supervisor_notes && <span style={{ fontStyle: 'italic' }}>"{log.supervisor_notes}"</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* APPROVAL MODAL */}
      {showApprovalModal && selectedLog && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', width: '100%', maxWidth: '500px' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Review PM Work</h2>
              <button onClick={() => setShowApprovalModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.25rem' }}>
              <div style={{ marginBottom: '1.25rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                <p><strong>Schedule:</strong> {selectedLog.preventive_maintenance_schedules?.schedule_name}</p>
                <p><strong>Performed By:</strong> {selectedLog.users_preventive_maintenance_logs_performed_by_user_idTousers?.full_name}</p>
                <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <strong>Technician Notes:</strong><br/>
                  {selectedLog.notes}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.25rem' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '500' }}>Supervisor Notes (Optional)</label>
                <textarea
                  rows={3}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '0.9rem', resize: 'vertical' }}
                  value={supervisorNotes}
                  onChange={e => setSupervisorNotes(e.target.value)}
                  placeholder="Add any remarks regarding this work..."
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => submitApproval('Rejected')}
                  disabled={isSubmitting}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #ef4444', backgroundColor: 'transparent', color: '#ef4444', fontWeight: '600', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                >
                  <X size={16} style={{ verticalAlign: 'middle', marginRight: '0.2rem' }} /> Reject
                </button>
                <button
                  type="button"
                  onClick={() => submitApproval('Approved')}
                  disabled={isSubmitting}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', backgroundColor: '#22c55e', color: 'white', fontWeight: '600', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                >
                  <Check size={16} style={{ verticalAlign: 'middle', marginRight: '0.2rem' }} /> Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PMApprovals;
