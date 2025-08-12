import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../Services/api';
import './AddEquipment.css';

const AddEquipmentForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'tractor',
    dailyRate: '',
    weeklyRate: '',
    monthlyRate: '',
    location: '',
    features: '',
    specifications: ''
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]); // For image previews
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setError('');
    setSuccess('');

    // Generate image previews
    const previews = files.map((file) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      return new Promise((resolve) => {
        reader.onload = () => resolve(reader.result);
      });
    });

    Promise.all(previews).then((previews) => setImagePreviews(previews));
  };

  const handleDeleteImage = (index) => {
    const updatedImages = images.filter((_, i) => i !== index);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(updatedImages);
    setImagePreviews(updatedPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      formDataToSend.append(key, formData[key]);
    });
    images.forEach((image) => {
      formDataToSend.append('images', image);
    });

    try {
      const response = await api.post('/equipment', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('Equipment added successfully!');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error adding equipment');
    }
  };

  return (
    <div className="add-equipment-container">
      <h2 className="add-equipment-title">Add New Equipment</h2>

      {error && <p className="add-equipment-message error">{error}</p>}
      {success && <p className="add-equipment-message success">{success}</p>}

      <form onSubmit={handleSubmit} className="add-equipment-form">
        <input name="name" placeholder="Equipment Name" onChange={handleChange} required className="input" />
        <textarea name="description" placeholder="Description" onChange={handleChange} required className="input" />
        
        <select name="category" value={formData.category} onChange={handleChange} className="input">
          <option value="tractor">Tractor</option>
          <option value="harvester">Harvester</option>
          <option value="plow">Plow</option>
          <option value="seeder">Seeder</option>
          <option value="sprayer">Sprayer</option>
          <option value="irrigation">Irrigation</option>
          <option value="other">Other</option>
        </select>

        <input name="dailyRate" type="number" placeholder="Daily Rate" onChange={handleChange} required className="input" />
        <input name="weeklyRate" type="number" placeholder="Weekly Rate" onChange={handleChange} required className="input" />
        <input name="monthlyRate" type="number" placeholder="Monthly Rate" onChange={handleChange} required className="input" />
        <input name="location" placeholder="Location" onChange={handleChange} required className="input" />

        <input name="features" placeholder="Features (comma-separated)" onChange={handleChange} className="input" />
        <input name="specifications" placeholder='Specifications JSON (e.g., {"power": "50HP"})' onChange={handleChange} className="input" />
        
        <input type="file" multiple onChange={handleFileChange} className="input" />

        {/* Image Previews with Delete Button */}
        {imagePreviews.length > 0 && (
          <div className="image-previews">
            {imagePreviews.map((src, index) => (
              <div key={index} className="image-preview-container">
                <img src={src} alt={`Preview ${index}`} className="image-preview" />
                <button
                  type="button"
                  className="delete-image-btn"
                  onClick={() => handleDeleteImage(index)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <button type="submit" className="submit-btn">Add Equipment</button>
      </form>
    </div>
  );
};

export default AddEquipmentForm;