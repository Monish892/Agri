import React, { useEffect, useState } from 'react';
import api from '../Services/api'; // Ensure this is your Axios instance

const BookingRequestsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get('/bookings/owner');
        const data = res.data;

        // ✅ Access bookings array inside the response object
        if (Array.isArray(data.bookings)) {
          setBookings(data.bookings);
          setPagination(data.pagination || { total: 0, page: 1, pages: 0 });
        } else {
          console.warn('Unexpected data format:', data);
          setBookings([]);
        }
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status });
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status } : b))
      );
    } catch (error) {
      console.error('Failed to update booking status:', error);
    }
  };

  if (loading) {
    return <div className="p-4">Loading booking requests...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Booking Requests from Farmers</h2>
      {bookings.length === 0 ? (
        <p>No booking requests yet.</p>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking._id} className="p-4 border rounded shadow bg-white">
              <h3 className="text-xl font-semibold">{booking.equipment?.name || 'Unnamed Equipment'}</h3>
              <p>Status: <strong>{booking.status}</strong></p>
              <p>
                From:{' '}
                {booking.startDate
                  ? new Date(booking.startDate).toLocaleDateString()
                  : 'N/A'}{' '}
                To:{' '}
                {booking.endDate
                  ? new Date(booking.endDate).toLocaleDateString()
                  : 'N/A'}
              </p>
              <p>Renter: {booking.renter?.name || booking.renter?.email || 'Unknown'}</p>
              <p>Amount: ₹{booking.amount || 0}</p>

              {booking.status === 'pending' && (
                <div className="flex gap-2 mt-2">
                  <button
                    className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    onClick={() => handleStatusUpdate(booking._id, 'approved')}
                  >
                    Approve
                  </button>
                  <button
                    className="px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    onClick={() => handleStatusUpdate(booking._id, 'rejected')}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingRequestsPage;
