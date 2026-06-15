import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Wrench, AlertCircle, Clock, Package, CheckSquare, Settings 
} from 'lucide-react';

const COLORS = {
  Open: '#eab308',
  Assigned: '#3b82f6',
  'In Progress': '#a855f7',
  'On Hold': '#f97316',
  Completed: '#22c55e',
  Disposal: '#ef4444'
};

const PRIORITY_COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#22c55e'
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        setData(res.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading dashboard...</div>;
  if (!data) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--warning)' }}>Failed to load dashboard data.</div>;

  const { kpis, requests_by_status, requests_by_priority, recent_requests } = data;

  const KpiCard = ({ title, value, icon, color, bg }) => (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px',
      padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
      transition: 'transform 0.2s', cursor: 'default'
    }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
       onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
      <div style={{ backgroundColor: bg, color: color, padding: '0.75rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontWeight: '500' }}>{title}</div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '0' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-main)' }}>Dashboard Overview</h1>
        <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Global metrics and recent activity for the maintenance system.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <KpiCard title="Total Requests" value={kpis.total_requests} icon={<Wrench size={24} />} color="#3b82f6" bg="rgba(59,130,246,0.15)" />
        <KpiCard title="Open Requests" value={kpis.open_requests} icon={<AlertCircle size={24} />} color="#eab308" bg="rgba(234,179,8,0.15)" />
        <KpiCard title="In Progress" value={kpis.in_progress_requests} icon={<Clock size={24} />} color="#a855f7" bg="rgba(168,85,247,0.15)" />
        <KpiCard title="Total Assets" value={kpis.total_assets} icon={<Package size={24} />} color="#22c55e" bg="rgba(34,197,94,0.15)" />
        <KpiCard title="Total PM Schedules" value={kpis.total_pm_schedules} icon={<Settings size={24} />} color="#06b6d4" bg="rgba(6,182,212,0.15)" />
        <KpiCard title="Pending PM Logs" value={kpis.pending_pm_approvals} icon={<CheckSquare size={24} />} color="#f97316" bg="rgba(249,115,22,0.15)" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Bar Chart */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', color: 'var(--text-main)' }}>Requests by Status</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={requests_by_status} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <RechartsTooltip 
                  cursor={{fill: 'var(--bg-color)'}} 
                  contentStyle={{backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-main)'}} 
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {requests_by_status.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name] || 'var(--primary)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', color: 'var(--text-main)' }}>Requests by Priority</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={requests_by_priority}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {requests_by_priority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || 'var(--primary)'} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-main)'}} 
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: 'var(--text-main)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: 'var(--text-main)' }}>Recent Maintenance Requests</h3>
        
        {recent_requests.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No recent requests found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: '600' }}>Req Code</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: '600' }}>Branch</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: '600' }}>Priority</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: '600' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent_requests.map((req) => {
                  const statusColor = COLORS[req.request_statuses?.status_name] || 'var(--primary)';
                  const priorityColor = PRIORITY_COLORS[req.priority_levels?.priority_name] || 'var(--primary)';
                  return (
                    <tr key={req.request_id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: '600', color: 'var(--primary)' }}>
                        {req.request_code}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-main)' }}>
                        {req.branches?.branch_name}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{ backgroundColor: `${statusColor}20`, color: statusColor, padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600' }}>
                          {req.request_statuses?.status_name}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{ backgroundColor: `${priorityColor}20`, color: priorityColor, padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600' }}>
                          {req.priority_levels?.priority_name}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
