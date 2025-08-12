import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../Services/api';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser || !storedUser._id) {
          throw new Error('No user found in localStorage');
        }

        const res = await API.get(`/users/${storedUser._id}`);
        if (res.data && res.data.user) {
          setUser(res.data.user);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError(error.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="profile-container loading-container">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container error-container">
        <p className="error-message">Error: {error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container error-container">
        <p>No profile data available. Please log in again.</p>
        <Link to="/login" className="btn btn-primary">Go to Login</Link>
      </div>
    );
  }

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">{getInitial(user.name)}</div>
        <h1>{user.name || 'No Name'}'s Profile</h1>
        <span className="badge badge-success">
          {(user.role && typeof user.role === 'string') ? user.role.toUpperCase() : 'N/A'}
        </span>
      </div>

      <div className="profile-card">
        <h2>Personal Information</h2>
        
        <div className="profile-section">
          <div className="profile-field">
            <div className="profile-label">Email:</div>
            <div className="profile-value">{user.email || 'Not provided'}</div>
          </div>
          
          <div className="profile-field">
            <div className="profile-label">Contact:</div>
            <div className="profile-value">{user.contactNumber || 'Not provided'}</div>
          </div>

          {user.role === 'farmer' && (
            <div className="profile-field">
              <div className="profile-label">Location:</div>
              <div className="profile-value">{user.location || 'Not provided'}</div>
            </div>
          )}

          {user.role === 'owner' && (
            <>
              <div className="profile-field">
                <div className="profile-label">Business Name:</div>
                <div className="profile-value">{user.businessName || 'Not provided'}</div>
              </div>
              
              <div className="profile-field">
                <div className="profile-label">Address:</div>
                <div className="profile-value">{user.address || 'Not provided'}</div>
              </div>
              
              <div className="profile-field">
                <div className="profile-label">Verification Status:</div>
                <div className="profile-value">
                  <span className={`badge ${user.isVerified ? 'badge-success' : 'badge-warning'}`}>
                    {user.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="profile-actions">
          <Link to="/edit-profile" className="btn btn-primary">Edit Profile</Link>
          <Link to="/dashboard" className="btn btn-secondary">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
