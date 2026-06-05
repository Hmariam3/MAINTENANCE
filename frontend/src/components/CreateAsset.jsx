import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Save, ArrowLeft } from 'lucide-react';

const CreateAsset = () => {
  const navigate = useNavigate();
  const [lookups, setLookups] = useState({ categories: [], branches: [], sub_processess: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    asset_number: '',
    tag_number: '',
    serial_number: '',
    category_id: '',
    brand: '',
    model: '',
    branch_id: '',
    description: '',
    company_name: '',
    acquisition_year: '',
    capitalized_on: '',
    current_status: 'Active',
    district: '',
    cost_center_number: ''
  });

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const res = await api.get('/lookups');
        setLookups(res.data);
      } catch (error) {
        console.error('Error fetching lookups', error);
      }
    };
    fetchLookups();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    if (name === 'branch_id' && value) {
      const selectedBranch = lookups.branches.find(b => b.branch_id === parseInt(value));
      if (selectedBranch) {
        let districtName = selectedBranch.district || '';
        if (selectedBranch.district && lookups.sub_processess) {
          const districtIds = selectedBranch.district.split(',');
          const processNames = districtIds.map(id => {
            const sp = lookups.sub_processess.find(s => s.id === id.trim());
            return sp ? sp.process_name : id;
          });
          districtName = processNames.join(', ');
        }
        newFormData.district = districtName;
        newFormData.cost_center_number = selectedBranch.branch_code || '';
      }
    } else if (name === 'branch_id' && !value) {
      newFormData.district = '';
      newFormData.cost_center_number = '';
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/assets', formData);
      navigate('/assets');
    } catch (error) {
      console.error('Error creating asset', error);
      alert('Failed to create asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container" style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Register New Asset</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Asset Number *</label>
            <input required type="text" name="asset_number" onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Tag Number *</label>
            <input required type="text" name="tag_number" onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Serial Number</label>
          <input type="text" name="serial_number" onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }} />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Category *</label>
            <select required name="category_id" onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>
              <option value="">Select Category</option>
              {lookups.categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Branch</label>
            <select name="branch_id" onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>
              <option value="">Select Branch</option>
              {lookups.branches.map(b => <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Brand</label>
            <input type="text" name="brand" value={formData.brand} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Model</label>
            <input type="text" name="model" value={formData.model} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>District</label>
            <input type="text" name="district" value={formData.district} readOnly style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', opacity: 0.7 }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Cost Center (Branch Code)</label>
            <input type="text" name="cost_center_number" value={formData.cost_center_number} readOnly style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', opacity: 0.7 }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Company Name</label>
            <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Current Status</label>
            <select name="current_status" onChange={handleChange} value={formData.current_status} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>
              <option value="Active">Active</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Disposed">Disposed</option>
              <option value="Replaced">Replaced</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Acquisition Year</label>
            <input type="number" name="acquisition_year" value={formData.acquisition_year} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Capitalized On</label>
            <input type="date" name="capitalized_on" value={formData.capitalized_on} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows="3" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', resize: 'vertical' }}></textarea>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button type="button" onClick={() => navigate('/assets')} style={{ flex: 1, padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
          <button type="submit" style={{ flex: 1, padding: '0.75rem', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Save Asset</button>
        </div>
      </form>
    </div>
  );
};

export default CreateAsset;
