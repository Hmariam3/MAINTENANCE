import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Package, Search, Plus, Eye, X, Monitor, Calendar, MapPin, Hash, ShieldCheck, HardDrive, Download, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit] = useState(10);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [branchSearch, setBranchSearch] = useState('');
  const [costCenter, setCostCenter] = useState('');

  // Lookups state
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  
  // Modal state
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [page, categoryId, branchSearch, costCenter]);

  // Handle search typing separately with a small delay
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (page !== 1) setPage(1); // Reset page on new search
      else fetchAssets();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const fetchLookups = async () => {
    try {
      const res = await api.get('/lookups');
      setCategories(res.data.categories || []);
      setBranches(res.data.branches || []);
    } catch (error) {
      console.error('Error fetching lookups:', error);
    }
  };

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const selectedBranch = branches.find(b => b.branch_name === branchSearch);
      const branchIdValue = selectedBranch ? selectedBranch.branch_id : '';

      const params = {
        page,
        limit,
        search: searchTerm,
        category: categoryId,
        branch: branchIdValue,
        cost_center: costCenter
      };
      const res = await api.get('/assets', { params });
      if (res.data && res.data.data) {
        setAssets(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotalRecords(res.data.total || res.data.data.length);
      } else {
        // Fallback for previous API structure if it hasn't updated yet somehow
        setAssets(res.data);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const openDetails = (asset) => {
    setSelectedAsset(asset);
  };

  const closeModal = () => {
    setSelectedAsset(null);
  };

  const downloadData = async () => {
    try {
      const selectedBranch = branches.find(b => b.branch_name === branchSearch);
      const branchIdValue = selectedBranch ? selectedBranch.branch_id : '';

      // Fetch full filtered dataset for export
      const params = {
        search: searchTerm,
        category: categoryId,
        branch: branchIdValue,
        cost_center: costCenter,
        export: true
      };
      const res = await api.get('/assets', { params });
      const exportData = res.data.data || res.data;

      // Create workbook
      const wb = XLSX.utils.book_new();

      const headers = [
        "Asset Number",
        "Tag Number",
        "Category",
        "Brand",
        "Model",
        "Serial Number",
        "Cost Center",
        "Branch",
        "IP Address",
        "Status",
        "Acquisition Year",
        "Capitalized On"
      ];

      const rows = exportData.map(a => [
        a.asset_number,
        a.tag_number,
        a.asset_categories?.category_name || 'N/A',
        a.brand || '',
        a.model || '',
        a.serial_number || '',
        a.cost_center_number || '',
        a.branches?.branch_name || '',
        a.ip_address || '',
        a.current_status || '',
        a.acquisition_year || '',
        a.capitalized_on ? new Date(a.capitalized_on).toLocaleDateString() : ''
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, "Assets Data");

      XLSX.writeFile(wb, "Assets_Export.xlsx");
    } catch (err) {
      console.error("Failed to generate Excel export:", err);
      alert("Failed to export data. Please check your network connection.");
    }
  };

  return (
    <div style={{ padding: '0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-main)' }}>Asset Management</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Manage and view details for all registered hardware and equipment.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={downloadData}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.65rem 1.25rem', backgroundColor: '#10B981', 
              color: 'white', border: 'none', borderRadius: '8px', 
              fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#059669'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#10B981'}
          >
            <Download size={18} /> Export Excel
          </button>
          <Link 
            to="/assets/new" 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.65rem 1.25rem', backgroundColor: 'var(--primary)', 
              color: 'white', textDecoration: 'none', borderRadius: '8px', 
              fontWeight: '600', fontSize: '0.9rem', transition: 'background-color 0.2s',
              boxShadow: '0 2px 4px rgba(var(--primary-rgb), 0.2)'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-dark)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--primary)'}
          >
            <Plus size={18} /> Register Asset
          </Link>
        </div>
      </div>

      {/* Filters Section */}
      <div style={{ 
        backgroundColor: 'var(--surface)', padding: '1.25rem', borderRadius: '12px', 
        border: '1px solid var(--border)', marginBottom: '1.5rem',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'
      }}>
        {/* Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Search Assets</label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Search size={16} />
            </div>
            <input 
              type="text" 
              placeholder="Tag, brand, model..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                width: '100%', padding: '0.65rem 1rem 0.65rem 2.25rem', 
                backgroundColor: 'var(--background)', border: '1px solid var(--border)', 
                borderRadius: '8px', color: 'var(--text-main)', outline: 'none', fontSize: '0.9rem'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Category</label>
          <select 
            value={categoryId} 
            onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
            style={{ 
              width: '100%', padding: '0.65rem 1rem', 
              backgroundColor: 'var(--background)', border: '1px solid var(--border)', 
              borderRadius: '8px', color: 'var(--text-main)', outline: 'none', fontSize: '0.9rem'
            }}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
            ))}
          </select>
        </div>

        {/* Branch Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Branch</label>
          <input 
            type="text" 
            list="assets-branch-list"
            placeholder="Type to search branch..."
            value={branchSearch}
            onChange={(e) => { setBranchSearch(e.target.value); setPage(1); }}
            style={{ 
              width: '100%', padding: '0.65rem 1rem', 
              backgroundColor: 'var(--background)', border: '1px solid var(--border)', 
              borderRadius: '8px', color: 'var(--text-main)', outline: 'none', fontSize: '0.9rem'
            }}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <datalist id="assets-branch-list">
            {branches.map(b => (
              <option key={b.branch_id} value={b.branch_name} style={{ color: '#000', backgroundColor: '#fff' }} />
            ))}
          </datalist>
        </div>

        {/* Cost Center Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Cost Center</label>
          <input 
            type="text" 
            placeholder="Cost Center code..." 
            value={costCenter}
            onChange={(e) => { setCostCenter(e.target.value); setPage(1); }}
            style={{ 
              width: '100%', padding: '0.65rem 1rem', 
              backgroundColor: 'var(--background)', border: '1px solid var(--border)', 
              borderRadius: '8px', color: 'var(--text-main)', outline: 'none', fontSize: '0.9rem'
            }}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
      </div>
      
      {loading && assets.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading assets...</div>
      ) : (
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-light)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '1rem', fontWeight: '600' }}>Tag & Asset #</th>
                  <th style={{ padding: '1rem', fontWeight: '600' }}>Category</th>
                  <th style={{ padding: '1rem', fontWeight: '600' }}>Brand & Model</th>
                  <th style={{ padding: '1rem', fontWeight: '600' }}>Branch</th>
                  <th style={{ padding: '1rem', fontWeight: '600' }}>Cost Center</th>
                  <th style={{ padding: '1rem', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '1rem', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.9rem' }}>
                {assets.map((asset) => (
                  <tr key={asset.asset_id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-light)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{asset.tag_number}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{asset.asset_number}</div>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-main)' }}>{asset.asset_categories?.category_name || 'N/A'}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '500', color: 'var(--text-main)' }}>{asset.brand || 'Unknown'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{asset.model || 'Unknown'}</div>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-main)' }}>{asset.branches?.branch_name || 'N/A'}</td>
                    <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{asset.cost_center_number || 'N/A'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '9999px', 
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: asset.current_status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: asset.current_status === 'Active' ? '#10B981' : '#EF4444',
                        border: `1px solid ${asset.current_status === 'Active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                      }}>
                        {asset.current_status || 'Unknown'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => openDetails(asset)}
                        style={{ 
                          background: 'var(--surface-light)', border: '1px solid var(--border)', color: 'var(--primary)', 
                          cursor: 'pointer', padding: '0.5rem', borderRadius: '6px',
                          display: 'inline-flex', alignItems: 'center', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--primary)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--surface-light)'; e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {assets.length === 0 && !loading && (
                  <tr>
                    <td colSpan="7" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '1rem', backgroundColor: 'var(--surface-light)', borderRadius: '50%' }}>
                          <Package size={32} style={{ opacity: 0.5 }} />
                        </div>
                        <div>No assets found matching your criteria.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 0 && (
            <div style={{ 
              padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: 'var(--surface)', fontSize: '0.9rem', color: 'var(--text-muted)'
            }}>
              <div>
                Showing <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{totalRecords === 0 ? 0 : ((page - 1) * limit) + 1}</span> to <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{Math.min(page * limit, totalRecords)}</span> of <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{totalRecords}</span> entries
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0.4rem', borderRadius: '6px',
                    backgroundColor: page === 1 ? 'var(--surface-light)' : 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: page === 1 ? 'var(--text-muted)' : 'var(--text-main)',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    opacity: page === 1 ? 0.5 : 1
                  }}
                >
                  <ChevronLeft size={18} />
                </button>
                <div style={{ padding: '0 0.5rem', fontWeight: '500', color: 'var(--text-main)' }}>
                  Page {page} of {totalPages}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0.4rem', borderRadius: '6px',
                    backgroundColor: page === totalPages ? 'var(--surface-light)' : 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: page === totalPages ? 'var(--text-muted)' : 'var(--text-main)',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    opacity: page === totalPages ? 0.5 : 1
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modernized Asset Details Modal */}
      {selectedAsset && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 10 }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ padding: '0.75rem', backgroundColor: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '12px', color: 'var(--primary)' }}>
                  <Monitor size={24} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-main)', fontWeight: '700' }}>{selectedAsset.tag_number}</h2>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {selectedAsset.brand} {selectedAsset.model}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} style={{ background: 'var(--surface-light)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--danger)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--danger)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--surface-light)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Status Banner */}
              <div style={{ 
                padding: '1.25rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                backgroundColor: selectedAsset.current_status === 'Active' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                border: `1px solid ${selectedAsset.current_status === 'Active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ 
                    width: '10px', height: '10px', borderRadius: '50%', 
                    backgroundColor: selectedAsset.current_status === 'Active' ? '#10B981' : '#EF4444',
                    boxShadow: `0 0 0 3px ${selectedAsset.current_status === 'Active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                  }}></div>
                  <span style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '1.1rem' }}>Status</span>
                </div>
                <span style={{ 
                  color: selectedAsset.current_status === 'Active' ? '#10B981' : '#EF4444',
                  fontWeight: '700', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                  {selectedAsset.current_status || 'Unknown'}
                </span>
              </div>

              {/* Data Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                
                <div style={{ backgroundColor: 'var(--surface-light)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <Hash size={14} /> Asset Number
                  </div>
                  <div style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '1.05rem' }}>{selectedAsset.asset_number}</div>
                </div>

                <div style={{ backgroundColor: 'var(--surface-light)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <HardDrive size={14} /> Serial Number
                  </div>
                  <div style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '1.05rem' }}>{selectedAsset.serial_number || 'N/A'}</div>
                </div>

                <div style={{ backgroundColor: 'var(--surface-light)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <Package size={14} /> Category
                  </div>
                  <div style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '1.05rem' }}>{selectedAsset.asset_categories?.category_name || 'N/A'}</div>
                </div>

                <div style={{ backgroundColor: 'var(--surface-light)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <MapPin size={14} /> Location / Branch
                  </div>
                  <div style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '1.05rem' }}>{selectedAsset.branches?.branch_name || 'N/A'}</div>
                  {selectedAsset.cost_center_number && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontFamily: 'monospace' }}>CC: {selectedAsset.cost_center_number}</div>
                  )}
                </div>

                <div style={{ backgroundColor: 'var(--surface-light)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <Monitor size={14} /> IP Address
                  </div>
                  <div style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '1.05rem', fontFamily: 'monospace' }}>{selectedAsset.ip_address || 'N/A'}</div>
                </div>

                <div style={{ backgroundColor: 'var(--surface-light)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <ShieldCheck size={14} /> Company
                  </div>
                  <div style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '1.05rem' }}>{selectedAsset.company_name || 'N/A'}</div>
                </div>
                
                <div style={{ backgroundColor: 'var(--surface-light)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <Calendar size={14} /> Acquisition
                  </div>
                  <div style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '1.05rem' }}>{selectedAsset.acquisition_year || 'N/A'}</div>
                </div>

                <div style={{ backgroundColor: 'var(--surface-light)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <Calendar size={14} /> Capitalized On
                  </div>
                  <div style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '1.05rem' }}>
                    {selectedAsset.capitalized_on ? new Date(selectedAsset.capitalized_on).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                  </div>
                </div>

              </div>

              {selectedAsset.description && (
                <div style={{ marginTop: '0.5rem', backgroundColor: 'var(--surface-light)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', fontWeight: '600' }}>Description</div>
                  <div style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.6' }}>
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
