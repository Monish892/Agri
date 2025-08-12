import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

const FarmerDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <div className="grid">
      {/* Sidebar */}
      <div className="card" style={{ gridRow: 'span 2' }}>
        <div className="text-center mb-4">
          <div className="profile-avatar">{getInitial(user.name)}</div>
          <h3>{user.name || 'Unknown User'}</h3>
          <span className="badge badge-success">{(user.role || '').toUpperCase()}</span>
          <div className="mt-3">
            <button onClick={handleLogout} className="btn btn-danger">Logout</button>
          </div>
        </div>

        <ul className="nav-list">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'dashboard' ? 'nav-link-active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <span className="nav-icon">📊</span> Dashboard
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'profile' ? 'nav-link-active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <span className="nav-icon">👤</span> Profile
            </button>
          </li>
          <li className="nav-item">
            <Link to="/change-password" className="nav-link">
              <span className="nav-icon">🔒</span> Change Password
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/browse-equipment" className="nav-link">
              <span className="nav-icon">🔍</span> Browse Equipment
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/my-bookings" className="nav-link">
              <span className="nav-icon">📅</span> My Bookings
            </Link>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="card">
        {activeTab === 'dashboard' && (
          <>
            <h2>Welcome, {user.name || 'Farmer'}!</h2>
            <p>Here's a quick overview of your farming account and activities.</p>
            <div className="grid grid-3 mt-4">
              <div className="dashboard-card card-green">
                <div className="dashboard-card-icon">👤</div>
                <div className="dashboard-card-title">My Profile</div>
                <p className="mb-2">View and edit your information</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveTab('profile')}
                >
                  View Profile
                </button>
              </div>
              <div className="dashboard-card card-blue">
                <div className="dashboard-card-icon">🔍</div>
                <div className="dashboard-card-title">Browse Equipment</div>
                <p className="mb-2">Find equipment to rent</p>
                <Link to="/browse-equipment" className="btn btn-secondary">Browse Now</Link>
              </div>
              <div className="dashboard-card card-yellow">
                <div className="dashboard-card-icon">📅</div>
                <div className="dashboard-card-title">My Bookings</div>
                <p className="mb-2">Manage your equipment bookings</p>
                <Link to="/my-bookings" className="btn btn-warning">View Bookings</Link>
              </div>
            </div>
          </>
        )}

        {activeTab === 'profile' && (
          <>
            <h2>Farmer Profile</h2>
            <div className="profile-section">
              <div className="profile-field">
                <div className="profile-label">Name:</div>
                <div className="profile-value">{user.name || 'N/A'}</div>
              </div>
              <div className="profile-field">
                <div className="profile-label">Role:</div>
                <div className="profile-value">{user.role || 'N/A'}</div>
              </div>
              <div className="profile-field">
                <div className="profile-label">Email:</div>
                <div className="profile-value">{user.email || 'N/A'}</div>
              </div>
              <div className="profile-field">
                <div className="profile-label">Contact:</div>
                <div className="profile-value">{user.contactNumber || 'N/A'}</div>
              </div>
              <div className="profile-field">
                <div className="profile-label">Location:</div>
                <div className="profile-value">{user.location || 'N/A'}</div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/edit-profile" className="btn btn-primary">Edit Profile</Link>
              <Link to="/change-password" className="btn btn-secondary">Change Password</Link>
            </div>
          </>
        )}
      </div>

      {/* Quick Links and Status */}
      <div className="card">
        <h3 className="mb-3">Quick Links</h3>
        <div className="grid">
          <Link to="/edit-profile" className="dashboard-card card-blue">
            <div className="dashboard-card-icon">✏️</div>
            <div className="dashboard-card-title">Edit Profile</div>
          </Link>
          <Link to="/change-password" className="dashboard-card card-red">
            <div className="dashboard-card-icon">🔒</div>
            <div className="dashboard-card-title">Change Password</div>
          </Link>
          <Link to="/browse-equipment" className="dashboard-card card-green">
            <div className="dashboard-card-icon">🔍</div>
            <div className="dashboard-card-title">Find Equipment</div>
          </Link>
        </div>
        <div className="mt-4">
          <h3 className="mb-3">System Status</h3>
          <div className="profile-field">
            <div className="profile-label">Status:</div>
            <div className="profile-value">
              <span className="badge badge-success">Online</span>
            </div>
          </div>
          <div className="profile-field">
            <div className="profile-label">Last Login:</div>
            <div className="profile-value">Today, {new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;