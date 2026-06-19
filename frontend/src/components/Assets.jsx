import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Package, Search, Plus, Eye, X, Monitor, Calendar, MapPin, Hash, ShieldCheck, HardDrive, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await api.get('/assets');
      setAssets(res.data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets.filter(a => 
    a.asset_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.tag_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.model?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openDetails = (asset) => {
    setSelectedAsset(asset);
  };

  const closeModal = () => {
    setSelectedAsset(null);
  };

  const downloadTemplate = async () => {
    try {
      // Fetch data for lookup sheets
      const lookupsRes = await api.get('/lookups');
      const { categories, branches, sub_processess } = lookupsRes.data;

      // Create workbook
      const wb = XLSX.utils.book_new();

      // 1. Assets Sheet
      const assetHeaders = [
        "Asset Number (Required)",
        "Tag Number (Required)",
        "Serial Number",
        "Company Name",
        "Description",
        "Category ID (Required)",
        "Brand",
        "Model",
        "Cost Center Number (Branch Code)",
        "Branch ID",
        "District Name (Subprocess)",
        "IP Address",
        "Acquisition Year (YYYY)",
        "Capitalized On (MM/DD/YYYY)",
        "Current Status"
      ];
      
      const spMap = {};
      sub_processess.forEach(sp => {
        spMap[sp.id] = sp.process_name;
      });

      const assetSample = [
        "AST-001",
        "TAG-9901",
        "SN-1234567",
        "ABC Corp",
        "Dell XPS 15 Laptop",
        categories[0]?.category_id || 1,
        "Dell",
        "XPS 15",
        branches[0]?.branch_code || "ET0010002",
        branches[0]?.branch_id || 1,
        spMap[branches[0]?.district] || branches[0]?.district || "101",
        "192.168.1.5",
        "2023",
        "01/15/2023",
        "Active"
      ];
      const wsAssets = XLSX.utils.aoa_to_sheet([assetHeaders, assetSample]);
      XLSX.utils.book_append_sheet(wb, wsAssets, "Assets");

      // 2. Categories Sheet
      const catHeaders = ["Category ID", "Category Name", "Is Active"];
      const catRows = categories.map(c => [c.category_id, c.category_name, c.is_active]);
      const wsCategories = XLSX.utils.aoa_to_sheet([catHeaders, ...catRows]);
      XLSX.utils.book_append_sheet(wb, wsCategories, "Categories");

      // 3. Branches Sheet
      const branchHeaders = ["Branch ID", "Branch Name", "Cost Center (Branch Code)", "District Name"];
      const branchRows = branches.map(b => [
        b.branch_id,
        b.branch_name,
        b.branch_code || "",
        spMap[b.district] || b.district || ""
      ]);
      const wsBranches = XLSX.utils.aoa_to_sheet([branchHeaders, ...branchRows]);
      XLSX.utils.book_append_sheet(wb, wsBranches, "Branches");

      // Download
      XLSX.writeFile(wb, "Asset_Master_Data_Template.xlsx");

    } catch (err) {
      console.error("Failed to generate Excel template:", err);
      alert("Failed to generate template. Please check your network connection.");
    }
  };

  return (
    <div style={{ padding: '0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-main)' }}>Asset Management</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Manage and view details for all registered hardware and equipment.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={downloadTemplate}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.65rem 1.25rem', backgroundColor: 'var(--surface)', 
              color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '8px', 
              fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' 
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-light)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--surface)'}
          >
            <Download size={18} /> Download Template
          </button>
          <Link 
            to="/assets/new" 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.65rem 1.25rem', backgroundColor: 'var(--primary)', 
              color: 'white', textDecoration: 'none', borderRadius: '8px', 
              fontWeight: '600', fontSize: '0.9rem', transition: 'background-color 0.2s' 
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-dark)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--primary)'}
          >
            <Plus size={18} /> Register Asset
          </Link>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', position: 'relative', maxWidth: '400px' }}>
        <div style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }}>
          <Search size={18} />
        </div>
        <input 
          type="text" 
          placeholder="Search by tag, brand, or model..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', 
            backgroundColor: 'var(--surface)', border: '1px solid var(--border)', 
            borderRadius: '8px', color: 'var(--text-main)', outline: 'none' 
          }}
          onFocus={e => e.target.style.borderColor = 'var(--primary)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>
      
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading assets...</div>
      ) : (
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-light)', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Asset #</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Tag Number</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Category</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Brand & Model</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => (
                  <tr key={asset.asset_id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-light)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '1rem 1.5rem', fontWeight: '500', color: 'var(--primary)' }}>{asset.asset_number}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>{asset.tag_number}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>{asset.asset_categories?.category_name || 'N/A'}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: '600' }}>{asset.brand || 'Unknown'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{asset.model || 'Unknown'}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '9999px', 
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: asset.current_status === 'Active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: asset.current_status === 'Active' ? 'var(--secondary)' : 'var(--danger)'
                      }}>
                        {asset.current_status || 'Unknown'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => openDetails(asset)}
                        style={{ 
                          background: 'none', border: 'none', color: 'var(--text-muted)', 
                          cursor: 'pointer', padding: '0.5rem', borderRadius: '6px',
                          display: 'inline-flex', alignItems: 'center', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--primary)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredAssets.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Package size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                      <div>No assets found matching your search.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Asset Details Modal */}
      {selectedAsset && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary)', borderRadius: '12px', color: '#fff' }}>
                  <Monitor size={24} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-main)' }}>{selectedAsset.tag_number}</h2>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {selectedAsset.brand} {selectedAsset.model}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Status Banner */}
              <div style={{ 
                padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                backgroundColor: selectedAsset.current_status === 'Active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${selectedAsset.current_status === 'Active' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
              }}>
                <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>Current Status</span>
                <span style={{ 
                  color: selectedAsset.current_status === 'Active' ? 'var(--secondary)' : 'var(--danger)',
                  fontWeight: '700', fontSize: '1.1rem'
                }}>
                  {selectedAsset.current_status || 'Unknown'}
                </span>
              </div>

              {/* Grid of details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <Hash size={14} /> Asset Number
                    </div>
                    <div style={{ color: 'var(--text-main)', fontWeight: '500' }}>{selectedAsset.asset_number}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <HardDrive size={14} /> Serial Number
                    </div>
                    <div style={{ color: 'var(--text-main)', fontWeight: '500' }}>{selectedAsset.serial_number || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <Package size={14} /> Category
                    </div>
                    <div style={{ color: 'var(--text-main)', fontWeight: '500' }}>{selectedAsset.asset_categories?.category_name || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <Monitor size={14} /> IP Address
                    </div>
                    <div style={{ color: 'var(--text-main)', fontWeight: '500', fontFamily: 'monospace' }}>{selectedAsset.ip_address || 'N/A'}</div>
                  </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <MapPin size={14} /> Branch / Location
                    </div>
                    <div style={{ color: 'var(--text-main)', fontWeight: '500' }}>{selectedAsset.branches?.branch_name || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <ShieldCheck size={14} /> Company
                    </div>
                    <div style={{ color: 'var(--text-main)', fontWeight: '500' }}>{selectedAsset.company_name || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <Calendar size={14} /> Acquisition Year
                    </div>
                    <div style={{ color: 'var(--text-main)', fontWeight: '500' }}>{selectedAsset.acquisition_year || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <Calendar size={14} /> Capitalized On
                    </div>
                    <div style={{ color: 'var(--text-main)', fontWeight: '500' }}>
                      {selectedAsset.capitalized_on ? new Date(selectedAsset.capitalized_on).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>

              </div>

              {selectedAsset.description && (
                <div style={{ marginTop: '0.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Description</div>
                  <div style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    {selectedAsset.description}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;
