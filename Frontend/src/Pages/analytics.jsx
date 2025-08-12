import React, { useEffect, useState } from 'react';
import api from '../Services/api';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/analytics');
        console.log('Analytics Data:', response.data);

        if (response.data.message === 'No analytics data available' || response.data.data?.length === 0) {
          setError('No data available for analytics');
        } else {
          setAnalyticsData(response.data.data || response.data);
        }
      } catch (err) {
        setError('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) return <p>Loading analytics...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="analytics-container">
      <h3>Equipment Usage Analytics</h3>
      {analyticsData && analyticsData.length > 0 ? (
        <div className="analytics-cards">
          {analyticsData.map((item, index) => (
            <div key={index} className="analytics-card">
              <h4>{item.equipmentName || 'Unknown Equipment'}</h4>
              <p><strong>Rental Count:</strong> {item.rentalCount || 0}</p>
              <p><strong>Total Revenue:</strong> ${item.totalRevenue || 0}</p>
              <p><strong>Total Rental Duration:</strong> {item.totalRentalDuration || 0} hours</p>
              <p><strong>Average Rental Duration:</strong> {item.averageRentalDuration || 0} hours</p>
              <p><strong>Last Rented:</strong> {item.lastRented ? new Date(item.lastRented).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Last Updated By:</strong> {item.lastUpdatedBy || 'N/A'}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No analytics data to display.</p>
      )}
    </div>
  );
};

export default Analytics;