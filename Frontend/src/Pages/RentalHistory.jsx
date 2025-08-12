import React, { useEffect, useState } from 'react';
import api from '../Services/api'; // Import the custom API instance

const RentalHistory = () => {
  const [rentals, setRentals] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const response = await api.get('/rentals', {
          params: {
            page: 1,
            limit: 10,
          },
        });
        setRentals(response.data.rentals);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch rental history');
      } finally {
        setLoading(false);
      }
    };

    fetchRentals();
  }, []);

  if (loading) {
    return <div>Loading rental history...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Rental History</h2>
      {rentals.length === 0 ? (
        <p>No rentals found.</p>
      ) : (
        <ul className="space-y-4">
          {rentals.map((rental) => (
            <li key={rental._id} className="bg-white shadow rounded p-4">
              <h3 className="text-lg font-semibold">{rental.equipmentId.name}</h3>
              <p>Status: {rental.status}</p>
              <p>Start Date: {new Date(rental.startDate).toLocaleDateString()}</p>
              <p>End Date: {new Date(rental.endDate).toLocaleDateString()}</p>
              <p>Total Amount: ₹{rental.rentalAmount}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RentalHistory;