import { useState, useEffect } from 'react';
import api from '../Services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
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
      handleOAuthLogin(token);
    }
  }, []);
  
  // Handle OAuth login success
  const handleOAuthLogin = async (token) => {
    try {
      // Set token in headers for API requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Get user data
      const profileResponse = await api.get('/auth/me');
      const user = profileResponse.data.user;
      
      // Store user and token in context
      login(user, token);
      
      // Check if profile is complete
      const statusResponse = await api.get('/auth/profile-status');
      
      if (!statusResponse.data.isProfileComplete) {
        // User needs to complete profile
        navigate('/complete-profile');
        return;
      }
      
      // Decode token to get role
      const decoded = jwtDecode(token);
      
      // Success animation before redirect
      setAppear(false);
      setTimeout(() => {
        navigate('/');
      }, 300);
    } catch (err) {
      console.error('OAuth login error:', err);
      setError('Authentication failed. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      
      const decoded = jwtDecode(res.data.token);
      const role = decoded.role;
      
      // Success animation before redirect
      setAppear(false);
      setTimeout(() => {
        if (role === 'owner') {
          navigate('/');
        } else if (role === 'farmer') {
          navigate('/');
        } else {
          navigate('/');
        }
      }, 300);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      setIsLoading(false);
    }
  };
  
  // Handle Google sign-in - fixed to use the API_URL variable instead of process.env
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
      
      <div className={`auth-card ${appear ? 'active' : ''}`}>
        <div className="auth-logo">
          <span className="logo-icon">🌾</span>
          <h1>AgriRent</h1>
        </div>
        
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to continue to AgriRent</p>
        
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
          <span>Sign in with Google</span>
        </button>
        
        <div className="auth-divider">
          <span>or</span>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-group">
              <span className="input-icon">✉️</span>
              <input
                type="email"
                className="form-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <span className="input-focus-bg"></span>
            </div>
          </div>
          
          <div className="form-group">
            <div className="password-header">
              <label className="form-label">Password</label>
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>
            <div className="input-group">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="input-focus-bg"></span>
            </div>
          </div>
          
          <button
            type="submit"
            className={`auth-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            <span className="button-text">Log In</span>
            <span className="button-loader"></span>
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register" className="auth-link">Sign up</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;