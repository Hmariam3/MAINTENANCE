import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Save, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

// Category → detail type mapping (mirrors backend constants)
const CATEGORY_DETAIL_TYPE = { 1: 'hardware', 2: 'generator', 3: 'electrical', 4: 'electrical' };

const HARDWARE_TYPES  = ['Laptop', 'Desktop', 'Printer', 'Router', 'Switch', 'Server', 'Monitor', 'UPS', 'Other'];
const ELECTRICAL_TYPES = ['AC Unit', 'UPS System', 'Electrical Panel', 'Switchgear', 'Transformer', 'Cable/Wiring', 'Light Fixture', 'Other'];
const GENERATOR_CATS  = ['Diesel Generator', 'Petrol Generator', 'Gas Generator', 'Standby Generator', 'Portable Generator', 'Other'];

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

const CreateRequest = () => {
  const navigate  = useNavigate();
  const { user }  = useContext(AuthContext);
  const [lookups, setLookups] = useState({
    categories: [], branches: [], priorities: [], users: [], assets: [], sub_processess: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    requester_user_id: user?.user_id || '',
    branch_id:         user?.branch_id || '',
    district:          '',
    due_date:          '',
    category_id:       '',
    asset_id:          '',
    priority_id:       '',
    problem_description: '',
  });

  // Category-specific detail fields — pre-filled from asset where possible
  const [typeDetails, setTypeDetails] = useState({
    // Hardware
    hardware_type: '', brand: '', model: '', serial_number: '', tag_number: '', quantity: 1, ip_address: '',
    // Generator (brand/model/tag_number shared with hardware state keys)
    generator_category: '', engine_serial_number: '', engine_model: '', engine_running_hours: '',
    // Electrical (model/serial_number/tag_number shared)
    maintenance_type: '', sub_category: '',
  });

  const detailType = CATEGORY_DETAIL_TYPE[parseInt(formData.category_id)] || null;

  const resolveDistrictName = (rawDistrict, subProcessess) => {
    if (!rawDistrict || !subProcessess) return '';
    return rawDistrict.split(',').map(id => {
      const sp = subProcessess.find(s => s.id === id.trim());
      return sp ? sp.process_name : id;
    }).join(', ');
  };

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const res = await api.get('/lookups');
        setLookups(res.data);
        if (user?.branch_id) {
          const userBranch = res.data.branches?.find(b => b.branch_id === user.branch_id);
          if (userBranch?.district) {
            setFormData(prev => ({
              ...prev,
              district: resolveDistrictName(userBranch.district, res.data.sub_processess)
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching lookups', err);
      }
    };
    fetchLookups();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let next = { ...formData, [name]: value };

    if (name === 'asset_id' && value) {
      const asset = lookups.assets.find(a => a.asset_id === parseInt(value));
      if (asset) {
        next.category_id = asset.category_id || '';
        const assetBranch = lookups.branches.find(b => b.branch_id === asset.branch_id);
        if (assetBranch?.district) {
          next.district = resolveDistrictName(assetBranch.district, lookups.sub_processess);
        }
        // Pre-fill type details from asset
        setTypeDetails(prev => ({
          ...prev,
          brand:         asset.brand         || '',
          model:         asset.model         || '',
          serial_number: asset.serial_number || '',
          tag_number:    asset.tag_number    || '',
          ip_address:    asset.ip_address    || '',
        }));
      }
    } else if (name === 'asset_id' && !value) {
      next.category_id = '';
      next.district    = '';
      setTypeDetails(prev => ({
        ...prev, brand: '', model: '', serial_number: '', tag_number: '', ip_address: ''
      }));
    }

    setFormData(next);
  };

  const handleTypeDetailChange = (e) => {
    const { name, value } = e.target;
    setTypeDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...formData };
      if (detailType) payload.type_details = typeDetails;
      await api.post('/requests', payload);
      navigate('/requests');
    } catch (err) {
      console.error('Error creating request', err);
      alert(err.response?.data?.error || 'Failed to create request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const branchAssets = lookups.assets.filter(a => a.branch_id === user?.branch_id);
  const selectedCategory = lookups.categories.find(c => c.category_id === parseInt(formData.category_id));

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate('/requests')}
          style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Create Maintenance Request</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Requester info banner */}
        <div style={{ padding: '0.875rem 1rem', backgroundColor: 'rgba(var(--primary-rgb,59,130,246),0.08)', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-main)' }}>Requester:</strong> {user?.full_name || user?.username} &nbsp;|&nbsp;
            <strong style={{ color: 'var(--text-main)' }}>Branch:</strong> {lookups.branches.find(b => b.branch_id === user?.branch_id)?.branch_name || 'Unknown'}
          </p>
        </div>

        {/* Asset */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Asset *</label>
          <select required name="asset_id" onChange={handleChange} style={inputStyle} value={formData.asset_id}>
            <option value="">— Select Asset —</option>
            {branchAssets.map(a => (
              <option key={a.asset_id} value={a.asset_id}>
                {a.tag_number} — {a.brand} {a.model}
              </option>
            ))}
          </select>
          {branchAssets.length === 0 && (
            <small style={{ color: 'var(--warning)', marginTop: '0.2rem' }}>No assets found for your branch.</small>
          )}
          {selectedCategory && (
            <small style={{ color: 'var(--text-muted)' }}>
              Category: <strong>{selectedCategory.category_name}</strong>
            </small>
          )}
        </div>

        {/* Priority + Due Date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Priority *</label>
            <select required name="priority_id" onChange={handleChange} style={inputStyle} value={formData.priority_id}>
              <option value="">— Select Priority —</option>
              {lookups.priorities.map(p => (
                <option key={p.priority_id} value={p.priority_id}>{p.priority_name}</option>
              ))}
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Due Date</label>
            <input type="datetime-local" name="due_date" onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        {/* Problem Description */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Problem Description *</label>
          <textarea
            required name="problem_description" onChange={handleChange} rows={4}
            placeholder="Describe the issue in detail..."
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {/* ── Category-Specific Detail Fields ──────────────────────────── */}
        {detailType === 'hardware' && (
          <DetailSection title="🖥️ Hardware Details" subtitle="Pre-filled from asset — edit if needed">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Hardware Type</label>
                <select name="hardware_type" value={typeDetails.hardware_type} onChange={handleTypeDetailChange} style={inputStyle}>
                  <option value="">— Select Type —</option>
                  {HARDWARE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Brand</label>
                <input name="brand" value={typeDetails.brand} onChange={handleTypeDetailChange} style={inputStyle} placeholder="e.g. Dell" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Model</label>
                <input name="model" value={typeDetails.model} onChange={handleTypeDetailChange} style={inputStyle} placeholder="e.g. Latitude 5520" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Serial Number</label>
                <input name="serial_number" value={typeDetails.serial_number} onChange={handleTypeDetailChange} style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Tag Number</label>
                <input name="tag_number" value={typeDetails.tag_number} onChange={handleTypeDetailChange} style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Quantity</label>
                <input type="number" min="1" name="quantity" value={typeDetails.quantity} onChange={handleTypeDetailChange} style={inputStyle} />
              </div>
              <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
                <label style={labelStyle}>IP Address</label>
                <input name="ip_address" value={typeDetails.ip_address} onChange={handleTypeDetailChange} style={inputStyle} placeholder="e.g. 192.168.1.100" />
              </div>
            </div>
          </DetailSection>
        )}

        {detailType === 'generator' && (
          <DetailSection title="⚡ Generator Details" subtitle="Pre-filled from asset — edit if needed">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Generator Category</label>
                <select name="generator_category" value={typeDetails.generator_category} onChange={handleTypeDetailChange} style={inputStyle}>
                  <option value="">— Select Category —</option>
                  {GENERATOR_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Brand</label>
                <input name="brand" value={typeDetails.brand} onChange={handleTypeDetailChange} style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Model</label>
                <input name="model" value={typeDetails.model} onChange={handleTypeDetailChange} style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Tag Number</label>
                <input name="tag_number" value={typeDetails.tag_number} onChange={handleTypeDetailChange} style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Engine Serial Number</label>
                <input name="engine_serial_number" value={typeDetails.engine_serial_number} onChange={handleTypeDetailChange} style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Engine Model</label>
                <input name="engine_model" value={typeDetails.engine_model} onChange={handleTypeDetailChange} style={inputStyle} />
              </div>
              <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Engine Running Hours</label>
                <input type="number" step="0.1" name="engine_running_hours" value={typeDetails.engine_running_hours} onChange={handleTypeDetailChange} style={inputStyle} placeholder="e.g. 1250.5" />
              </div>
            </div>
          </DetailSection>
        )}

        {detailType === 'electrical' && (
          <DetailSection title="🔌 Electrical Details" subtitle="Pre-filled from asset — edit if needed">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Maintenance Type</label>
                <select name="maintenance_type" value={typeDetails.maintenance_type} onChange={handleTypeDetailChange} style={inputStyle}>
                  <option value="">— Select Type —</option>
                  {ELECTRICAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Sub Category</label>
                <input name="sub_category" value={typeDetails.sub_category} onChange={handleTypeDetailChange} style={inputStyle} placeholder="e.g. Split AC 2.5 Ton" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Model</label>
                <input name="model" value={typeDetails.model} onChange={handleTypeDetailChange} style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Serial Number</label>
                <input name="serial_number" value={typeDetails.serial_number} onChange={handleTypeDetailChange} style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Tag Number</label>
                <input name="tag_number" value={typeDetails.tag_number} onChange={handleTypeDetailChange} style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Quantity</label>
                <input type="number" min="1" name="quantity" value={typeDetails.quantity} onChange={handleTypeDetailChange} style={inputStyle} />
              </div>
            </div>
          </DetailSection>
        )}

        {/* Hidden fields */}
        <input type="hidden" name="requester_user_id" value={formData.requester_user_id} />
        <input type="hidden" name="branch_id"         value={formData.branch_id} />
        <input type="hidden" name="district"          value={formData.district} />
        <input type="hidden" name="category_id"       value={formData.category_id} />

        {/* Submit */}
        <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.5rem' }}>
          <button
            type="button" onClick={() => navigate('/requests')}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="submit" disabled={isSubmitting}
            style={{ flex: 2, padding: '0.75rem', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: '700', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Save size={16} /> {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── Detail Section wrapper ────────────────────────────────────────────────
function DetailSection({ title, subtitle, children }) {
  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '10px', padding: '1.25rem',
      borderLeft: '4px solid var(--primary)'
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)' }}>{title}</h3>
        {subtitle && <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export default CreateRequest;
