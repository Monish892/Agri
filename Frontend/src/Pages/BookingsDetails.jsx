import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, AlertCircle, Calendar, DollarSign, User, Box, Truck, Clock, MapPin } from 'lucide-react';
import api from '../Services/api';
import './BookingDetails.css';

const BookingDetails = () => {
  const { id } = useParams();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [pickupDetails, setPickupDetails] = useState({
    address: '',
    contactPerson: '',
    contactNumber: '',
    instructions: '',
  });
  const [showPickupForm, setShowPickupForm] = useState(false);

  // Fetch booking details
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/bookings/${id}`);
        const bookingData = res.data?.booking;
        if (!bookingData) throw new Error('Booking not found');
        setBooking(bookingData);
        if (bookingData.pickupDetails) setPickupDetails(bookingData.pickupDetails);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBookingDetails();
    else {
      setError('Invalid booking ID');
      setLoading(false);
    }
  }, [id]);

  // Razorpay payment handler
  const handleRazorpayPayment = async () => {
    setPaymentStatus(null);
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setPaymentStatus({ type: 'error', message: 'Failed to load Razorpay SDK' });
      return;
    }

    try {
      // Create order on backend
      const { data } = await api.post('/payments/create-razorpay-order', { bookingId: id });
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Add this to your .env
        amount: data.amount,
        currency: data.currency,
        name: 'AgriRent',
        description: `Booking #${booking?._id}`,
        order_id: data.razorpayOrderId,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyRes = await api.post('/payments/verify-razorpay-payment', {
              bookingId: id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
            setBooking(verifyRes.data.booking);
            setPaymentStatus({ type: 'success', message: 'Payment successful! Your booking is confirmed.' });
          } catch (err) {
            setPaymentStatus({ type: 'error', message: 'Payment verification failed.' });
          }
        },
        prefill: {
          name: booking?.renter?.name || '',
          email: booking?.renter?.email || '',
          contact: booking?.renter?.contactNumber || '',
        },
        theme: { color: '#2c784e' },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setPaymentStatus({ type: 'error', message: err.response?.data?.message || 'Payment initiation failed.' });
    }
  };

  // Helper functions (unchanged)
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString();
  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await api.put(`/bookings/${id}/cancel`);
      setBooking(res.data.booking);
      setPaymentStatus({ type: 'success', message: 'Booking canceled successfully' });
    } catch (err) {
      setPaymentStatus({ type: 'error', message: 'Failed to cancel booking.' });
    }
  };
  const handlePickupDetailsSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/bookings/${id}/pickup-details`, pickupDetails);
      setBooking(res.data.booking);
      setPaymentStatus({ type: 'success', message: 'Pickup details saved successfully' });
      setShowPickupForm(false);
    } catch (err) {
      setPaymentStatus({ type: 'error', message: 'Failed to save pickup details.' });
    }
  };
  const handlePickupInputChange = (e) => {
    const { name, value } = e.target;
    setPickupDetails((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="booking-details loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="booking-details">
        <div className="status-message error">
          <XCircle size={20} />
          {error}
        </div>
      </div>
    );
  }

  const days = Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24));
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={18} />;
      case 'approved':
        return <CheckCircle size={18} />;
      case 'canceled':
        return <XCircle size={18} />;
      case 'completed':
        return <CheckCircle size={18} />;
      default:
        return <AlertCircle size={18} />;
    }
  };
  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle size={18} />;
      case 'pending':
        return <Clock size={18} />;
      default:
        return <AlertCircle size={18} />;
    }
  };

  return (
    <div className="booking-details">
      <div className="text-center mb-6">
        <h1>Booking Details</h1>
      </div>

      {paymentStatus && (
        <div className={`status-message ${paymentStatus.type}`}>
          {paymentStatus.type === 'success' && <CheckCircle size={20} />}
          {paymentStatus.type === 'error' && <XCircle size={20} />}
          {paymentStatus.type === 'info' && <AlertCircle size={20} />}
          {paymentStatus.message}
        </div>
      )}

      <div className="card">
        <h2>Booking Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <p>
            <Box size={16} className="inline mr-2" />
            <strong>Equipment:</strong> {booking?.equipment?.name}
          </p>
          <p>
            <User size={16} className="inline mr-2" />
            <strong>Owner:</strong> {booking?.owner?.name}
          </p>
          <p>
            {getStatusIcon(booking?.status)} <strong>Status:</strong> {booking?.status}
          </p>
          <p>
            {getPaymentStatusIcon(booking?.paymentStatus)} <strong>Payment:</strong> {booking?.paymentStatus}
          </p>
          <p>
            <Calendar size={16} className="inline mr-2" />
            <strong>Start Date:</strong> {formatDate(booking?.startDate)}
          </p>
          <p>
            <Calendar size={16} className="inline mr-2" />
            <strong>End Date:</strong> {formatDate(booking?.endDate)}
          </p>
          <p>
            <Clock size={16} className="inline mr-2" />
            <strong>Total Days:</strong> {days}
          </p>
          <p>
            <DollarSign size={16} className="inline mr-2" />
            <strong>Total Amount:</strong> ₹{booking?.totalAmount}
          </p>
        </div>
      </div>

      {booking?.pickupDetails && Object.values(booking.pickupDetails).some((val) => val) && (
        <div className="card">
          <h2>Pickup Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <p>
              <MapPin size={16} className="inline mr-2" />
              <strong>Address:</strong> {booking.pickupDetails.address}
            </p>
            <p>
              <User size={16} className="inline mr-2" />
              <strong>Contact Person:</strong> {booking.pickupDetails.contactPerson}
            </p>
            <p>
              <Truck size={16} className="inline mr-2" />
              <strong>Contact Number:</strong> {booking.pickupDetails.contactNumber}
            </p>
            {booking.pickupDetails.instructions && (
              <p>
                <AlertCircle size={16} className="inline mr-2" />
                <strong>Instructions:</strong> {booking.pickupDetails.instructions}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {booking?.paymentStatus !== 'paid' && booking?.status !== 'canceled' && (
          <div className="razorpay-container">
            <button className="btn" onClick={handleRazorpayPayment}>
              Pay with Razorpay
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
          {booking?.status === 'approved' && (
            <button
              onClick={() => setShowPickupForm((prev) => !prev)}
              className="btn"
            >
              {showPickupForm ? 'Hide Pickup Form' : 'Add/Edit Pickup Details'}
            </button>
          )}
        </div>
      </div>

      {showPickupForm && (
        <form onSubmit={handlePickupDetailsSubmit} className="pickup-form">
          <h3>Pickup Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                name="address"
                value={pickupDetails.address}
                onChange={handlePickupInputChange}
                required
                placeholder="Pickup Address"
              />
            </div>
            <div>
              <input
                name="contactPerson"
                value={pickupDetails.contactPerson}
                onChange={handlePickupInputChange}
                required
                placeholder="Contact Person"
              />
            </div>
            <div>
              <input
                name="contactNumber"
                value={pickupDetails.contactNumber}
                onChange={handlePickupInputChange}
                required
                placeholder="Contact Number"
                pattern="[0-9]{10}"
                title="Please enter a valid 10-digit phone number"
              />
            </div>
            <div>
              <input
                name="instructions"
                value={pickupDetails.instructions}
                onChange={handlePickupInputChange}
                placeholder="Special Instructions (optional)"
              />
            </div>
          </div>
          <button type="submit" className="btn">
            Save Pickup Details
          </button>
        </form>
      )}
    </div>
  );
};

// Razorpay script loader
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default BookingDetails;