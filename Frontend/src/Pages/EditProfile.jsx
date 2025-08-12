import React, { useState, useEffect } from 'react';
import API from '../Services/api';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const EditProfile = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contactNumber: '',
    profilePicture: '',
    location: '',
    businessName: '',
    address: ''

  });
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const decoded = jwtDecode(token);
        const id = decoded.id;
        
        const res = await API.get(`/users/${id}`);
        const user = res.data.user;
        setCurrentUser(user);
        setFormData({
          name: user.name || '',
          contactNumber: user.contactNumber || '',
          profilePicture: user.profilePicture || '',
          location: user.location || '',
          businessName: user.businessName || '',
          address: user.address || ''
        });
      } catch (err) {
        console.error(err);
      }
    };

    fetchUser();
  }, []);
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const navigate=useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.put('/users/profile', formData);
      alert('Profile updated!');
      navigate('/')
    } catch (err) {
      console.error(err);
    }
  };

  if (!currentUser) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-2 p-4">
      <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" />
      <input name="contactNumber" value={formData.contactNumber} onChange={handleChange} placeholder="Contact Number" />
      <input name="profilePicture" value={formData.profilePicture} onChange={handleChange} placeholder="Profile Picture URL" />
      
      {currentUser.role === 'farmer' && (
        <input name="location" value={formData.location} onChange={handleChange} placeholder="Location" />
      )}

      {currentUser.role === 'owner' && (
        <>
          <input name="businessName" value={formData.businessName} onChange={handleChange} placeholder="Business Name" />
          <input name="address" value={formData.address} onChange={handleChange} placeholder="Address" />
        </>
      )}

      <button type="submit">Save</button>
    </form>
  );
};

export default EditProfile;
