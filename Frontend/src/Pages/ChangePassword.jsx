import React, { useState, useEffect } from 'react';
import API from '../Services/api';

const ChangePassword = () => {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [passwordStrength, setPasswordStrength] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Check password strength when newPassword changes
    if (name === 'newPassword') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength('');
      return;
    }
    
    // Simple password strength check
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    const isLongEnough = password.length >= 8;
    
    const strength = 
      [hasLowerCase, hasUpperCase, hasNumbers, hasSpecialChar, isLongEnough]
        .filter(Boolean).length;
    
    if (strength <= 2) setPasswordStrength('weak');
    else if (strength <= 4) setPasswordStrength('medium');
    else setPasswordStrength('strong');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (form.newPassword !== form.confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }
    
    if (passwordStrength === 'weak') {
      setMessage({ 
        text: 'Please choose a stronger password', 
        type: 'error' 
      });
      return;
    }
    
    setLoading(true);
    try {
      await API.post('/users/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      
      setMessage({ text: 'Password changed successfully!', type: 'success' });
      setForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setMessage({ 
        text: err.response?.data?.message || 'Failed to change password', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="password-change-container">
      <h2 className="password-change-title">Change Your Password</h2>
      
      <form className="password-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <input 
            type="password" 
            name="currentPassword" 
            id="currentPassword"
            className="form-input"
            value={form.currentPassword}
            onChange={handleChange}
            placeholder=" "
            required
          />
          <label htmlFor="currentPassword" className="form-label">Current Password</label>
        </div>
        
        <div className="form-group">
          <input 
            type="password" 
            name="newPassword" 
            id="newPassword"
            className="form-input"
            value={form.newPassword}
            onChange={handleChange}
            placeholder=" "
            required
          />
          <label htmlFor="newPassword" className="form-label">New Password</label>
          
          {form.newPassword && (
            <div className="password-strength">
              <div className={`password-strength-bar strength-${passwordStrength}`}></div>
            </div>
          )}
        </div>
        
        <div className="form-group">
          <input 
            type="password" 
            name="confirmPassword" 
            id="confirmPassword"
            className="form-input"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder=" "
            required
          />
          <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
        </div>
        
        <button 
          type="submit" 
          className="submit-button"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Change Password'}
        </button>
      </form>
      
      {message.text && (
        <div className={`${message.type}-message show`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default ChangePassword;