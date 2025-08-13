import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../Services/api';
import './CreateBookingForm.css';

const CreateBookingForm = () => {
  const { equipmentId } = useParams();
  const navigate = useNavigate();

  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    specialRequirements: '',
  });

  // Fetch equipment details when component loads
  useEffect(() => {
    const fetchEquipmentDetails = async () => {
      try {
        const response = await api.get(`/equipment/${equipmentId}`);
        setEquipment(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching equipment details:', err);
        setError('Failed to load equipment details. Please try again.');
        setLoading(false);
      }
    };

    if (equipmentId) {
      fetchEquipmentDetails();
    } else {
      setError('No equipment selected');
      setLoading(false);
    }
  }, [equipmentId]);

  // Scroll to top when error/message is set
  useEffect(() => {
    if (error || message) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error, message]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  // Calculate duration in days (inclusive)
  const calculateDurationDays = () => {
    if (!form.startDate || !form.endDate) return 0;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    // Ensure both dates are valid
    if (isNaN(start) || isNaN(end)) return 0;
    // Calculate difference in milliseconds
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    // Add 1 to include both start and end date
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // Calculate estimated total based on duration and daily rate
  const estimatedTotal = () => {
    const days = calculateDurationDays();
    return equipment?.dailyRate && days > 0 ? days * equipment.dailyRate : 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setFormLoading(true);

    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError('End date must be after start date.');
      setFormLoading(false);
      return;
    }

    try {
      const bookingData = {
        equipmentId: equipmentId,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        specialRequirements: form.specialRequirements,
      };

      const response = await api.post('/bookings', bookingData);
      setMessage('Booking created successfully!');

      setTimeout(() => {
        navigate('/my-bookings');
      }, 2000);
    } catch (err) {
      console.error('Booking error:', err.response?.data);

      if (err.response?.data?.errors) {
        setError(err.response.data.errors.map((e) => e.msg).join(', '));
      } else if (err.response?.data?.conflicts) {
        setError('Equipment is already booked for the selected dates. Please choose different dates.');
      } else {
        setError(err.response?.data?.message || 'Booking failed. Please try again.');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Use correct image base URL for equipment images
  const IMAGE_BASE_URL = import.meta.env.VITE_API_URL.replace('/api', '');

  return (
    <div className="create-booking-form">
      <h1>Book Equipment</h1>

      {loading ? (
        <div className="text-center py-8">
          <p>Loading equipment details...</p>
        </div>
      ) : error && !equipment ? (
        <div className="status-message error">
          <p>{error}</p>
          <button
            onClick={() => navigate('/browse-equipment')}
            className="btn cancel"
          >
            Back to Equipment List
          </button>
        </div>
      ) : (
        <>
          {/* Equipment Details */}
          <div className="equipment-details">
            <div className="flex flex-col md:flex-row gap-6">
              {equipment?.images?.[0] && (
                <img
                  src={`${IMAGE_BASE_URL}${equipment.images[0]}`}
                  alt={equipment.name}
                  className="equipment-image"
                />
              )}
              <div>
                <h2>{equipment?.name}</h2>
                <p className="category">{equipment?.category}</p>
                <p className="price">₹{equipment?.dailyRate}/day</p>
                {equipment?.weeklyRate && <p>₹{equipment?.weeklyRate}/week</p>}
                {equipment?.monthlyRate && <p>₹{equipment?.monthlyRate}/month</p>}
                <p>{equipment?.location}</p>
                <p>{equipment?.description}</p>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="form-container">
            <h3>Booking Details</h3>

            {message && <div className="status-message success">{message}</div>}

            {error && <div className="status-message error">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label>Start Date</label>
                <input
                  name="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label>End Date</label>
                <input
                  name="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={handleChange}
                  required
                  min={form.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label>Special Requirements</label>
                <textarea
                  name="specialRequirements"
                  placeholder="Any special requirements or instructions?"
                  value={form.specialRequirements}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              {form.startDate && form.endDate && (
                <div className="estimated-total">
                  Estimated Total: ₹{estimatedTotal()} ({calculateDurationDays()} day
                  {calculateDurationDays() > 1 ? 's' : ''})
                </div>
              )}

              <button
                type="submit"
                disabled={
                  formLoading || new Date(form.endDate) < new Date(form.startDate)
                }
              >
                {formLoading ? 'Processing...' : 'Confirm Booking'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default CreateBookingForm;