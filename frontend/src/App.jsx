import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Activity, Package, Wrench, Settings, Users } from 'lucide-react';
import './index.css';

import { AuthProvider, AuthContext } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import Assets from './components/Assets';
import Requests from './components/Requests';
import RequestDetail from './components/RequestDetail';
import CreateAsset from './components/CreateAsset';
import CreateRequest from './components/CreateRequest';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import PMSchedules from './components/PMSchedules';
import PMApprovals from './components/PMApprovals';

import SetProfile from './components/SetProfile';

// const Inventory = () => <div className="p-6"><h1>Inventory</h1><p>Spare parts and stock levels.</p></div>;

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function AppContent() {
  const { user, logout } = useContext(AuthContext);

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/set-profile" element={<SetProfile />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div className="app-container">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>MaintenanceHub</h2>
        </div>
        <ul className="nav-links">
          {[2, 3, 4, 5, 8].includes(user.role_id) && (
            <li><Link to="/"><Activity className="icon" /> Dashboard</Link></li>
          )}
          {[5, 4].includes(user.role_id) && (
            <li><Link to="/assets"><Package className="icon" /> Assets</Link></li>
          )}
          <li><Link to="/requests"><Wrench className="icon" /> Requests</Link></li>
          {/* <li><Link to="/inventory"><Settings className="icon" /> Inventory</Link></li> */}
          {user.role_id === 4 && (
            <li><Link to="/pm-schedules"><Wrench className="icon" /> PM Schedules</Link></li>
          )}
          {[2, 5, 8].includes(user.role_id) && (
            <li><Link to="/pm-approvals"><Wrench className="icon" /> PM Approvals</Link></li>
          )}
          {[2, 5, 8].includes(user.role_id) && (
            <li><Link to="/users"><Users className="icon" /> Users</Link></li>
          )}
        </ul>
      </nav>

      <main className="main-content">
        <header className="top-header">
          <div className="user-profile">
            <span>{user.full_name || user.username}</span>
            <div className="avatar" style={{ cursor: 'pointer' }} onClick={logout}>
              {(user.full_name || user.username).charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="content-area">
          <Routes>
            <Route path="/" element={<ProtectedRoute>{[2, 5, 8].includes(user.role_id) ? <Dashboard /> : <Navigate to="/requests" />}</ProtectedRoute>} />
            <Route path="/assets" element={<ProtectedRoute>{[5, 4].includes(user.role_id) ? <Assets /> : <Navigate to="/" />}</ProtectedRoute>} />
            <Route path="/assets/new" element={<ProtectedRoute>{[5, 4].includes(user.role_id) ? <CreateAsset /> : <Navigate to="/" />}</ProtectedRoute>} />
            <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
            <Route path="/requests/new" element={<ProtectedRoute><CreateRequest /></ProtectedRoute>} />
            <Route path="/requests/:id" element={<ProtectedRoute><RequestDetail /></ProtectedRoute>} />
            {/* <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} /> */}
            <Route path="/pm-schedules" element={<ProtectedRoute>{user.role_id === 4 ? <PMSchedules /> : <Navigate to="/" />}</ProtectedRoute>} />
            <Route path="/pm-approvals" element={<ProtectedRoute>{[2, 5, 8].includes(user.role_id) ? <PMApprovals /> : <Navigate to="/" />}</ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute>{[2, 5, 8].includes(user.role_id) ? <UserManagement /> : <Navigate to="/" />}</ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
