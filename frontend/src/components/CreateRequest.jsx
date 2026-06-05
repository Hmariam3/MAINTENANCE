import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Save, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const CreateRequest = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [lookups, setLookups] = useState({ categories: [], branches: [], priorities: [], users: [], assets: [], sub_processess: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    requester_user_id: user?.user_id || '',
    branch_id: user?.branch_id || '',
    district: '',
    due_date: '',
    category_id: '',
    asset_id: '',
    priority_id: '',
    problem_description: ''
  });

  const resolveDistrictName = (rawDistrict, subProcessess) => {
    if (!rawDistrict || !subProcessess) return '';
    const ids = rawDistrict.split(',');
    const names = ids.map(id => {
      const sp = subProcessess.find(s => s.id === id.trim());
      return sp ? sp.process_name : id;
    });
    return names.join(', ');
  };

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const res = await api.get('/lookups');
        setLookups(res.data);

        // Auto-set resolved district name from the user's branch
        if (user?.branch_id) {
          const userBranch = res.data.branches?.find(b => b.branch_id === user.branch_id);
          if (userBranch?.district) {
            const districtName = resolveDistrictName(userBranch.district, res.data.sub_processess);
            setFormData(prev => ({ ...prev, district: districtName }));
          }
        }
      } catch (error) {
        console.error('Error fetching lookups', error);
      }
    };
    fetchLookups();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    // Auto set category AND district when asset is selected
    if (name === 'asset_id' && value) {
      const selectedAsset = lookups.assets.find(a => a.asset_id === parseInt(value));
      if (selectedAsset) {
        newFormData.category_id = selectedAsset.category_id || '';
        // Resolve district name from the asset's branch
        const assetBranch = lookups.branches.find(b => b.branch_id === selectedAsset.branch_id);
        if (assetBranch?.district) {
          newFormData.district = resolveDistrictName(assetBranch.district, lookups.sub_processess);
        }
      }
    } else if (name === 'asset_id' && !value) {
      newFormData.category_id = '';
      newFormData.district = '';
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/requests', formData);
      navigate('/requests');
    } catch (error) {
      console.error('Error creating request', error);
      alert('Failed to create request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const branchAssets = lookups.assets.filter(a => a.branch_id === user?.branch_id);

  return (
    <div className="form-container" style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Create Maintenance Request</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Hidden inputs to pass user context to backend if needed */}
        <input type="hidden" name="requester_user_id" value={formData.requester_user_id} />
        <input type="hidden" name="branch_id" value={formData.branch_id} />
        <input type="hidden" name="district" value={formData.district} />
        <input type="hidden" name="category_id" value={formData.category_id} />

        <div style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px', marginBottom: '1rem' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <strong>Requester:</strong> {user?.full_name || user?.username} <br />
            <strong>Branch:</strong> {lookups.branches.find(b => b.branch_id === user?.branch_id)?.branch_name || 'Unknown'}
          </p>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Asset *</label>
          <select required name="asset_id" onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>
            <option value="">Select Asset</option>
            {branchAssets.map(a => <option key={a.asset_id} value={a.asset_id}>{a.tag_number} - {a.brand} {a.model}</option>)}
          </select>
          {branchAssets.length === 0 && <small style={{ color: 'var(--warning)', marginTop: '0.25rem', display: 'block' }}>No assets found for your branch.</small>}
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Priority *</label>
            <select required name="priority_id" onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>
              <option value="">Select Priority</option>
              {lookups.priorities.map(p => <option key={p.priority_id} value={p.priority_id}>{p.priority_name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Due Date</label>
            <input type="datetime-local" name="due_date" onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Problem Description *</label>
          <textarea required name="problem_description" onChange={handleChange} rows="4" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', resize: 'vertical' }}></textarea>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button type="button" onClick={() => navigate('/requests')} style={{ flex: 1, padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
          <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '0.75rem', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRequest;
