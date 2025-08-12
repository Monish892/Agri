import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const RentalForm = () => {
  const { equipmentId } = useParams();
  const navigate = useNavigate();

  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 3)),
    rentalType: 'daily',
  });

  const [rentalPreview, setRentalPreview] = useState({
    days: 3,
    cost: 0,
  });

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/equipment/${equipmentId}`);
        setEquipment(response.data.equipment);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch equipment details');
        setLoading(false);
      }
    };

    fetchEquipment();
  }, [equipmentId]);

  useEffect(() => {
    if (equipment) {
      calculateRentalPreview();
    }
  }, [equipment, formData]);

  const calculateRentalPreview = () => {
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const durationMs = end - start;
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

    let cost = 0;

    switch (formData.rentalType) {
      case 'daily':
        cost = equipment.dailyRate * durationDays;
        break;
      case 'weekly':
        const weeks = Math.ceil(durationDays / 7);
        cost = equipment.weeklyRate * weeks;
        break;
      case 'monthly':
        const months = Math.ceil(durationDays / 30);
        cost = equipment.monthlyRate * months;
        break;
      default:
        cost = equipment.dailyRate * durationDays;
    }

    setRentalPreview({
      days: durationDays,
      cost,
    });
  };

  const handleStartDateChange = (date) => {
    let newEndDate = formData.endDate;
    if (date >= formData.endDate) {
      newEndDate = new Date(date);
      newEndDate.setDate(date.getDate() + 1);
    }

    setFormData({
      ...formData,
      startDate: date,
      endDate: newEndDate,
    });
  };

  const handleEndDateChange = (date) => {
    setFormData({
      ...formData,
      endDate: date,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('/api/rentals', {
        equipmentId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        rentalType: formData.rentalType,
      });

      navigate(`/rentals/${response.data.rental._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create rental request');
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4 text-gray-600">Loading equipment details...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">{error}</div>;
  }

  if (!equipment) {
    return <div className="container mx-auto p-4">Equipment not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center text-blue-500 hover:text-blue-700"
      >
        ← Back to equipment
      </button>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3">
            {equipment.images && equipment.images.length > 0 ? (
              <img
                src={equipment.images[0]}
                alt={equipment.name}
                className="w-full h-64 object-cover"
              />
            ) : (
              <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">No image</span>
              </div>
            )}
          </div>

          <div className="md:w-2/3 p-6">
            <h1 className="text-2xl font-bold mb-2">{equipment.name}</h1>
            <p className="text-gray-600 mb-4">{equipment.category}</p>

            <div className="mb-4">
              <span className="font-semibold">Daily Rate:</span> ${equipment.dailyRate.toFixed(2)}
              {equipment.weeklyRate && (
                <span className="ml-4">
                  <span className="font-semibold">Weekly Rate:</span>{' '}
                  ${equipment.weeklyRate.toFixed(2)}
                </span>
              )}
              {equipment.monthlyRate && (
                <span className="ml-4">
                  <span className="font-semibold">Monthly Rate:</span>{' '}
                  ${equipment.monthlyRate.toFixed(2)}
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} className="mt-6">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <DatePicker
                    selected={formData.startDate}
                    onChange={handleStartDateChange}
                    minDate={new Date()}
                    className="border rounded w-full px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <DatePicker
                    selected={formData.endDate}
                    onChange={handleEndDateChange}
                    minDate={new Date(formData.startDate.getTime() + 86400000)}
                    className="border rounded w-full px-3 py-2"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Rental Type</label>
                <select
                  name="rentalType"
                  value={formData.rentalType}
                  onChange={handleInputChange}
                  className="border rounded w-full px-3 py-2"
                >
                  <option value="daily">Daily</option>
                  {equipment.weeklyRate && <option value="weekly">Weekly</option>}
                  {equipment.monthlyRate && <option value="monthly">Monthly</option>}
                </select>
              </div>

              <div className="bg-gray-50 p-4 rounded mb-6">
                <h3 className="font-medium mb-3">Rental Summary</h3>
                <div className="flex justify-between mb-2">
                  <span>Duration:</span>
                  <span>
                    {rentalPreview.days} day{rentalPreview.days !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Rental Cost:</span>
                  <span>${rentalPreview.cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>${rentalPreview.cost.toFixed(2)}</span>
                </div>
              </div>

              {error && (
                <div
                  className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6"
                  role="alert"
                >
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              >
                Submit Rental Request
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalForm;
