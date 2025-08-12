import { useState, useEffect } from 'react';
import api from '../Services/api';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '', 
    email: '', 
    password: '', 
    role: 'farmer', 
    contactNumber: '',
    location: '', 
    businessName: '', 
    address: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  
  // Animation states
  const [appear, setAppear] = useState(false);

  // Define API URL - fix for "process is not defined" error
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    setAppear(true);
    
    // Check for OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      // If token exists in URL, user was redirected from OAuth flow
      localStorage.setItem('token', token);
      checkProfileCompletion(token);
    }
  }, []);
  
  // Check if Google OAuth user needs to complete profile
  const checkProfileCompletion = async (token) => {
    try {
      // Set the token in the API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Check profile status
      const response = await api.get('/auth/profile-status');
      
      if (!response.data.isProfileComplete) {
        // User needs to complete their profile
        // Stay on register page but show a notification
        setError('Please complete your profile information');
      } else {
        // Profile is complete, redirect to home
        navigate('/');
      }
    } catch (err) {
      console.error('Error checking profile status:', err);
      setError('Authentication error. Please try again.');
    }
  };

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateStep1 = () => {
    return formData.name && formData.email && formData.password && formData.role;
  };

  const goToNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const goToPreviousStep = () => {
    setStep(1);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await api.post('/auth/register', formData);
      
      // Success animation before redirect
      setAppear(false);
      setTimeout(() => {
        navigate('/login');
      }, 300);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setIsLoading(false);
    }
  };
  
  // Handle Google sign-in - fixed to use API_URL variable
  const handleGoogleSignIn = () => {
    window.location.href = `${API_URL.replace('/api', '')}/api/auth/google`;
  };

  return (
    <div className="auth-container">
      <div className={`auth-background ${appear ? 'active' : ''}`}>
        <div className="auth-shape shape-1"></div>
        <div className="auth-shape shape-2"></div>
        <div className="auth-shape shape-3"></div>
      </div>
      
      <div className={`auth-card register-card ${appear ? 'active' : ''}`}>
        <div className="auth-logo">
          <span className="logo-icon">🌾</span>
          <h1>AgriRent</h1>
        </div>
        
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Join the AgriRent community today</p>
        
        {error && <div className="auth-error">{error}</div>}
        
        {/* Google OAuth Button */}
        <button 
          type="button" 
          className="google-auth-button" 
          onClick={handleGoogleSignIn}
        >
          <img 
            src="https://cdn.cdnlogo.com/logos/g/35/google-icon.svg" 
            alt="Google" 
            className="google-icon" 
          />
          <span>Sign up with Google</span>
        </button>
        
        <div className="auth-divider">
          <span>or</span>
        </div>
        
        <div className="step-indicator">
          <div className={`step ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Basic Info</div>
          </div>
          <div className="step-connector"></div>
          <div className={`step ${step === 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Details</div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          {step === 1 && (
            <div className="step-content">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-group">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    autoFocus
                  />
                  <span className="input-focus-bg"></span>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Email</label>
                <div className="input-group">
                  <span className="input-icon">✉️</span>
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <span className="input-focus-bg"></span>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-group">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    name="password"
                    className="form-input"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <span className="input-focus-bg"></span>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Account Type</label>
                <div className="role-selector">
                  <div 
                    className={`role-option ${formData.role === 'farmer' ? 'selected' : ''}`}
                    onClick={() => setFormData({...formData, role: 'farmer'})}
                  >
                    <div className="role-icon">👨‍🌾</div>
                    <div className="role-name">Farmer</div>
                    <div className="role-desc">Rent equipment for your farm</div>
                  </div>
                  <div 
                    className={`role-option ${formData.role === 'owner' ? 'selected' : ''}`}
                    onClick={() => setFormData({...formData, role: 'owner'})}
                  >
                    <div className="role-icon">🚜</div>
                    <div className="role-name">Owner</div>
                    <div className="role-desc">Rent out your equipment</div>
                  </div>
                </div>
              </div>
              
              <button 
                type="button" 
                className="auth-button" 
                onClick={goToNextStep}
                disabled={!validateStep1()}
              >
                Continue
              </button>
            </div>
          )}
          
          {step === 2 && (
            <div className="step-content">
              <div className="form-group">
                <label className="form-label">Contact Number</label>
                <div className="input-group">
                  <span className="input-icon">📱</span>
                  <input
                    type="tel"
                    name="contactNumber"
                    className="form-input"
                    placeholder="Enter your contact number"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    required
                  />
                  <span className="input-focus-bg"></span>
                </div>
              </div>
              
              {formData.role === 'farmer' && (
                <div className="form-group">
                  <label className="form-label">Farm Location</label>
                  <div className="input-group">
                    <span className="input-icon">📍</span>
                    <input
                      type="text"
                      name="location"
                      className="form-input"
                      placeholder="Enter your farm location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                    />
                    <span className="input-focus-bg"></span>
                  </div>
                </div>
              )}
              
              {formData.role === 'owner' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Business Name</label>
                    <div className="input-group">
                      <span className="input-icon">🏢</span>
                      <input
                        type="text"
                        name="businessName"
                        className="form-input"
                        placeholder="Enter your business name"
                        value={formData.businessName}
                        onChange={handleChange}
                        required
                      />
                      <span className="input-focus-bg"></span>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Business Address</label>
                    <div className="input-group">
                      <span className="input-icon">📍</span>
                      <input
                        type="text"
                        name="address"
                        className="form-input"
                        placeholder="Enter your business address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                      />
                      <span className="input-focus-bg"></span>
                    </div>
                  </div>
                </>
              )}
              
              <div className="button-group">
                <button 
                  type="button" 
                  className="auth-button secondary" 
                  onClick={goToPreviousStep}
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  className={`auth-button ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading}
                >
                  <span className="button-text">Create Account</span>
                  <span className="button-loader"></span>
                </button>
              </div>
            </div>
          )}
        </form>
        
        <div className="auth-footer">
          <p>Already have an account? <Link to="/login" className="auth-link">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;