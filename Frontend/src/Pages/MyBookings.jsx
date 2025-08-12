import React, { useEffect, useState } from 'react';
import api from '../Services/api';
import { Loader2, Calendar, DollarSign, User, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import './MyBookings.css';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [limit] = useState(6);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchBookings = async (page = 1, status = '') => {
    try {
      setLoading(true);
      const res = await api.get(
        `/bookings/farmer?page=${page}&limit=${limit}&status=${status}`
      );
      setBookings(res.data.bookings);
      setPagination(res.data.pagination);
      if (isInitialLoad) setIsInitialLoad(false);
    } catch (err) {
      console.error('Failed to fetch bookings:', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(pagination.page, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, statusFilter]);

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString();

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'pending';
      case 'approved': return 'approved';
      case 'completed': return 'completed';
      case 'rejected':
      case 'canceled': return 'rejected';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="my-bookings">
      <h2>My Bookings</h2>

      {/* Status Filter */}
      <div className="filter-container">
        <label htmlFor="status" className="font-medium">
          Filter by Status:
        </label>
        <select
          id="status"
          value={statusFilter}
          onChange={handleStatusChange}
        >
          <option value="">All Bookings</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="canceled">Canceled</option>
        </select>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="text-gray-600 text-center p-6 bg-white rounded-lg shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg font-medium">No bookings found</p>
            <p className="text-sm mt-2">Try changing your filter or check back later.</p>
          </div>
        </div>
      ) : (
        <div className="grid">
          {bookings.map((booking, index) => (
            <div
              key={booking._id}
              className="booking-card"
              style={{ '--card-index': index }}
            >
              <img
                src={booking.equipment.images?.[0] || '/placeholder-equipment.jpg'}
                alt={booking.equipment.name}
                loading="lazy"
              />
              
              <h3>{booking.equipment.name}</h3>
              <p><Tag size={14} className="inline mr-1" /> {booking.equipment.category}</p>
              
              <div className="mt-2">
                <p>
                  <User size={14} className="inline mr-1" /> 
                  <strong>Owner:</strong> {booking.owner?.name || 'N/A'} 
                  {booking.owner?.businessName && <span> ({booking.owner.businessName})</span>}
                </p>
                
                <p>
                  <Calendar size={14} className="inline mr-1" />
                  <strong>Start:</strong> {formatDate(booking.startDate)} | 
                  <strong> End:</strong> {formatDate(booking.endDate)}
                </p>
                
                <p>
                  <strong>Status:</strong>{' '}
                  <span className={`status-badge ${getStatusClass(booking.status)}`}>
                    {booking.status}
                  </span>
                </p>
                
                <p>
                  <DollarSign size={14} className="inline mr-1" />
                  <strong>Total:</strong> ₹{booking.totalAmount}
                </p>
              </div>

              <Link
                to={`/bookings/farmer/${booking._id}`}
                className="view-details-btn"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.pages > 1 && (
        <div className="pagination">
          <button
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))
            }
            disabled={pagination.page === 1}
          >
            Previous
          </button>
          <span className="px-3 py-2 bg-white rounded-md shadow-sm">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                page: Math.min(prev.page + 1, pagination.pages),
              }))
            }
            disabled={pagination.page === pagination.pages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default MyBookings;