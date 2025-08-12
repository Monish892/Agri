import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

const AnimatedFooter = () => {
  const { user } = useAuth();
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {showScrollToTop && (
        <button 
          className="scroll-to-top"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </button>
      )}

      <footer className="animated-footer">
        <div className="footer-animation-bg">
          <div className="tractor-animation">
            <div className="tractor">
              <div className="tractor-body"></div>
              <div className="tractor-cabin"></div>
              <div className="tractor-wheel front"></div>
              <div className="tractor-wheel back"></div>
            </div>
          </div>
          <div className="plants">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`plant plant-${i+1}`}>
                <div className="stem"></div>
                <div className="leaf leaf-1"></div>
                <div className="leaf leaf-2"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="footer-content">
          <div className="footer-section about">
            <h3 className="highlight-text">AgriRental</h3>
            <p>Connecting farmers with the equipment they need. Simplifying agricultural equipment rental for a sustainable future.</p>
            <div className="contact">
              <p><i className="fas fa-phone"></i> +91 8610181418</p>
              <p><i className="fas fa-envelope"></i> info@agririental.com</p>
            </div>
            <div className="socials">
              <a href="#" className="social-icon"><i className="fab fa-facebook"></i></a>
              <a href="#" className="social-icon"><i className="fab fa-twitter"></i></a>
              <a href="https://www.instagram.com/gr_monish_/?next=%2F&hl=en" className="social-icon"><i className="fab fa-instagram"></i></a>
              <a href="https://www.linkedin.com/in/gr-monish-291006359/" className="social-icon"><i className="fab fa-linkedin"></i></a>
            </div>
          </div>

          <div className="footer-section links">
            <h3>Quick Links</h3>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/browse-equipment">Browse Equipment</Link></li>
              {!user ? (
                <>
                  <li><Link to="/login">Login</Link></li>
                  <li><Link to="/register">Register</Link></li>
                </>
              ) : (
                <>
                  <li><Link to="/dashboard">Dashboard</Link></li>
                  {user.role === 'farmer' && (
                    <li><Link to="/my-bookings">My Bookings</Link></li>
                  )}
                  {user.role === 'owner' && (
                    <>
                      <li><Link to="/my-equipments">My Equipment</Link></li>
                      <li><Link to="/booking-requests">Booking Requests</Link></li>
                    </>
                  )}
                </>
              )}
              <li><Link to="/rental-history">Rental History</Link></li>
            </ul>
          </div>

          <div className="footer-section contact-form">
            <h3>Contact Us</h3>
            <form>
              <input type="email" placeholder="Email Address" required />
              <textarea placeholder="Your message here..." required></textarea>
              <button type="submit" className="btn-submit">Send</button>
            </form>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p>&copy; {new Date().getFullYear()} AgriRental | All rights reserved</p>
            <div className="footer-menu">
              <a href="#">Terms of Service</a>
              <a href="#">Privacy Policy</a>
              <a href="#">FAQ</a>
            </div>
          </div>
        </div>

        <div className="footer-wave-container">
          <svg className="footer-wave" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
            <path fill="#4caf50" fillOpacity="0.8" d="M0,96L48,128C96,160,192,224,288,240C384,256,480,224,576,186.7C672,149,768,107,864,112C960,117,1056,171,1152,186.7C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </footer>
    </>
  );
};

export default AnimatedFooter;