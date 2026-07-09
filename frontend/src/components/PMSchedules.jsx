import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Plus, Wrench, Calendar, X, Save, FileText } from 'lucide-react';

const inputStyle = {
  width: '100%', padding: '0.75rem', borderRadius: '6px',
  border: '1px solid var(--border)', backgroundColor: 'var(--bg-color)',
  color: 'var(--text-main)', fontSize: '0.9rem', boxSizing: 'border-box'
};
const labelStyle = {
  display: 'block', marginBottom: '0.4rem',
  color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '500'
};
const fieldStyle = { display: 'flex', flexDirection: 'column', gap: '0.25rem' };

const PMSchedules = () => {
  const { user } = useContext(AuthContext);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lookups for the form
  const [lookups, setLookups] = useState({ branches: [], assets: [], categories: [] });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const [formData, setFormData] = useState({
    schedule_name: '', branch_id: '', category_id: '', asset_id: '', frequency_type: 'Monthly', next_due_date: ''
  });
  const [branchSearch, setBranchSearch] = useState('');
  const [logData, setLogData] = useState({
    notes: '', next_scheduled_date: '', hardware_replaced: '', cost: '', cost_saved: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSchedules();
    fetchLookups();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await api.get('/pm/schedules');
      setSchedules(res.data);
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const res = await api.get('/lookups');
      setLookups(res.data);
    } catch (err) {
      console.error('Error fetching lookups:', err);
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/pm/schedules', formData);
      setShowCreateModal(false);
      setFormData({ schedule_name: '', branch_id: '', category_id: '', asset_id: '', frequency_type: 'Monthly', next_due_date: '' });
      setBranchSearch('');
      fetchSchedules();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogWork = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/pm/logs', { schedule_id: selectedScheduleId, ...logData });
      setShowLogModal(false);
      setLogData({ notes: '', next_scheduled_date: '', hardware_replaced: '', cost: '', cost_saved: '' });
      alert('Work logged and sent for approval!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to log work');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openLogModal = (schedule) => {
    setSelectedScheduleId(schedule.schedule_id);
    setSelectedSchedule(schedule);
    setShowLogModal(true);
  };

  const filteredAssets = lookups.assets.filter(a => !formData.branch_id || a.branch_id === parseInt(formData.branch_id));

  return (
    <div style={{ padding: '0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-main)' }}>Preventive Maintenance Schedules</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Manage your assigned PM schedules and log completed work.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', border: 'none',
            padding: '0.65rem 1.25rem', backgroundColor: 'var(--primary)',
            color: 'white', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem'
          }}
        >
          <Plus size={16} /> New Schedule
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading schedules...</div>
      ) : schedules.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <Calendar size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <p style={{ margin: 0 }}>No schedules found.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
          {schedules.map(s => (
            <div key={s.schedule_id} style={{
              backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem',
              borderLeft: '4px solid var(--primary)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '1.05rem' }}>{s.schedule_name}</span>
                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: '600', backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                  {s.frequency_type || 'Custom'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                {s.branches && <span>📍 Branch: <strong>{s.branches.branch_name}</strong></span>}
                {s.asset_categories && <span>🏷️ Category: <strong>{s.asset_categories.category_name}</strong></span>}
                {s.assets && <span>⚙️ Asset: <strong>{s.assets.tag_number} ({s.assets.brand})</strong></span>}
                {s.next_due_date && <span style={{ color: '#eab308' }}>📅 Next Due: <strong>{new Date(s.next_due_date).toLocaleDateString()}</strong></span>}
              </div>
              <button
                onClick={() => openLogModal(s)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--primary)', backgroundColor: 'transparent', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--primary)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--primary)'; }}
              >
                <FileText size={16} /> Log Work
              </button>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>New PM Schedule</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateSchedule} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Schedule Name *</label>
                <input required style={inputStyle} value={formData.schedule_name} onChange={e => setFormData({ ...formData, schedule_name: e.target.value })} placeholder="e.g. Monthly AC Checkup" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Branch *</label>
                <input
                  required
                  type="text"
                  list="pm-branch-list"
                  placeholder="Type to search branch..."
                  style={{ ...inputStyle, outline: 'none' }}
                  value={branchSearch}
                  onChange={e => {
                    const val = e.target.value;
                    setBranchSearch(val);
                    const selectedBranch = lookups.branches.find(b => b.branch_name === val);
                    setFormData({ ...formData, branch_id: selectedBranch ? selectedBranch.branch_id : '', asset_id: '' });
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <datalist id="pm-branch-list">
                  {lookups.branches.map(b => <option key={b.branch_id} value={b.branch_name} style={{ color: '#000', backgroundColor: '#fff' }} />)}
                </datalist>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Asset * (Specific to selected branch)</label>
                <select required style={inputStyle} value={formData.asset_id} onChange={e => {
                  const asset = lookups.assets.find(a => a.asset_id === parseInt(e.target.value));
                  setFormData({ ...formData, asset_id: e.target.value, category_id: asset?.category_id || '' });
                }} disabled={!formData.branch_id}>
                  <option value="">— Select Asset —</option>
                  {filteredAssets.map(a => <option key={a.asset_id} value={a.asset_id}>{a.tag_number} - {a.brand}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Frequency</label>
                  <select style={inputStyle} value={formData.frequency_type} onChange={e => setFormData({ ...formData, frequency_type: e.target.value })}>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annually">Annually</option>
                    <option value="Once">Once</option>
                  </select>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Next Due Date</label>
                  <input type="date" required style={inputStyle} value={formData.next_due_date} onChange={e => setFormData({ ...formData, next_due_date: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: '600', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>{isSubmitting ? 'Saving...' : 'Save Schedule'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG WORK MODAL */}
      {showLogModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', width: '100%', maxWidth: '500px' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Log PM Work</h2>
              <button onClick={() => setShowLogModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleLogWork} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedSchedule && (
                <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <div style={fieldStyle}><span>Asset Tag:</span> <strong style={{ color: 'var(--text-main)' }}>{selectedSchedule.assets?.tag_number || 'N/A'}</strong></div>
                  <div style={fieldStyle}><span>Brand/Model:</span> <strong style={{ color: 'var(--text-main)' }}>{selectedSchedule.brand || selectedSchedule.assets?.brand} {selectedSchedule.model || selectedSchedule.assets?.model}</strong></div>
                  <div style={fieldStyle}><span>Serial No:</span> <strong style={{ color: 'var(--text-main)' }}>{selectedSchedule.serial_number || selectedSchedule.assets?.serial_number || 'N/A'}</strong></div>
                  <div style={fieldStyle}><span>Branch:</span> <strong style={{ color: 'var(--text-main)' }}>{selectedSchedule.branches?.branch_name || 'N/A'}</strong></div>
                </div>
              )}
              <div style={fieldStyle}>
                <label style={labelStyle}>Work Notes / Remarks *</label>
                <textarea required rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={logData.notes} onChange={e => setLogData({ ...logData, notes: e.target.value })} placeholder="Describe the work performed..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Replaced Spare Part List</label>
                  <input value={logData.hardware_replaced} onChange={e => setLogData({ ...logData, hardware_replaced: e.target.value })} style={inputStyle} placeholder="e.g. Filter, Belt" />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Spare Part Cost</label>
                  <input type="number" step="0.01" value={logData.cost} onChange={e => setLogData({ ...logData, cost: e.target.value })} style={inputStyle} placeholder="0.00" />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Labor Cost</label>
                  <input type="number" step="0.01" value={logData.cost_saved} onChange={e => setLogData({ ...logData, cost_saved: e.target.value })} style={inputStyle} placeholder="0.00" />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Next Scheduled Date</label>
                  <input type="date" style={inputStyle} value={logData.next_scheduled_date} onChange={e => setLogData({ ...logData, next_scheduled_date: e.target.value })} />
                </div>
              </div>
              <div style={{ padding: '0.8rem', backgroundColor: 'rgba(234,179,8,0.1)', borderRadius: '8px', color: '#b45309', fontSize: '0.85rem' }}>
                Submitting this will send the log to the branch supervisor for approval.
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowLogModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: '600', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>{isSubmitting ? 'Submitting...' : 'Submit for Approval'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PMSchedules;
