import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import FarmerDashboard from './FarmerDasboard';
import OwnerDashboard from './OwnerDasboard';

const HomePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log("Decoded token:", decoded); // Debug log to see what's in the token

        const normalizedRole = decoded.role ? decoded.role.toLowerCase() : null;

        setUser({
          id: decoded.id,
          name: decoded.name || 'User',
          originalRole: decoded.role || 'N/A',
          role: normalizedRole || 'N/A',
          email: decoded.email || '',
          contactNumber: decoded.contactNumber || '',
          location: decoded.location || '',
          businessName: decoded.businessName || '',
          address: decoded.address || '',
          isVerified: decoded.isVerified ?? false
        });
        setLoading(false);
      } catch (err) {
        console.error('Invalid token:', err);
        localStorage.removeItem('token');
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
        <p className="text-lg font-semibold text-green-700">Loading your dashboard...</p>
      </div>
    );
  }

  if (!user.role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 font-bold">
          User role is missing from the token. Please log in again.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container animate-fade-in">
        <div className="card card-header">
          <div>
            <h1>🌾 Smart Agriculture Platform</h1>
            <p>Empowering Farmers and Equipment Owners with Smart Solutions</p>
          </div>
        </div>

        {user.role === 'farmer' ? (
          <FarmerDashboard user={user} />
        ) : user.role === 'owner' ? (
          <OwnerDashboard user={user} />
        ) : (
          <div className="card">
            <h2>Welcome, {user.name}!</h2>
            <p>Your role ({user.originalRole}) is not recognized. Please contact support.</p>
            <div className="mt-4">
              <p className="text-red-500">Debug information:</p>
              <pre className="bg-gray-100 p-3 rounded mt-2 text-sm overflow-x-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
