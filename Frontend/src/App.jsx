import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import AnimatedFooter from './components/AnimatedFooter'; // Import the new footer component

import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dasboard';
import FarmerDashboard from './pages/FarmerDasboard';
import OwnerDashboard from './pages/OwnerDasboard';
import ProtectedRoute from './components/ProtectedRoute';

import UserProfile from './pages/UserProfile';
import EditProfile from './pages/EditProfile';
import ChangePassword from './pages/ChangePassword';
import UploadDocuments from './pages/UploadDocument';
import AddEquipmentForm from './pages/AddEquipment';
import EquipmentsPage from './pages/MyEquipments';
import EquipmentDetails from './pages/EquipmentDetails';
import BrowseEquipment from './pages/BrowseEquipment';
import MyBookings from './pages/MyBookings';
import CreateBookingForm from './pages/CreateBookingForm';
import BookingDetails from './pages/BookingsDetails';
import BookingRequestsPage from './pages/BokkingRequestPage'; // ✅ Owner view of farmer bookings
import RentalForm from './pages/RentForm'; // ✅ New rental form page
import RentalHistory from './pages/RentalHistory'; // ✅ Add RentalHistory page

// Import the new Equipment Analytics page component
import EquipmentAnalyticsPage from './pages/analytics'; // New page for analytics

import './Components/FooterAnimation.css'; // Import the footer animation CSS

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <div className="content-container">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/farmer" element={<ProtectedRoute role="farmer"><FarmerDashboard /></ProtectedRoute>} />
              <Route path="/owner" element={<ProtectedRoute role="owner"><OwnerDashboard /></ProtectedRoute>} />
              <Route path="/owner/dashboard" element={<ProtectedRoute role="owner"><OwnerDashboard /></ProtectedRoute>} />
              <Route path="/profile/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
              <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
              <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
              <Route path="/upload-documents" element={<ProtectedRoute role="owner"><UploadDocuments /></ProtectedRoute>} />
              <Route path="/add-equipment" element={<ProtectedRoute role="owner"><AddEquipmentForm /></ProtectedRoute>} />
              <Route path="/my-equipments" element={<ProtectedRoute role="owner"><EquipmentsPage /></ProtectedRoute>} />
              <Route path="/equipment/:id" element={<ProtectedRoute><EquipmentDetails /></ProtectedRoute>} />
              <Route path="/browse-equipment" element={<ProtectedRoute><BrowseEquipment /></ProtectedRoute>} />
              <Route path="/my-bookings" element={<ProtectedRoute role="farmer"><MyBookings /></ProtectedRoute>} />
              <Route path="/create-booking/:equipmentId" element={<ProtectedRoute role="farmer"><CreateBookingForm /></ProtectedRoute>} />
              <Route path="/bookings/:id" element={<ProtectedRoute role="farmer"><BookingDetails /></ProtectedRoute>} />
              <Route path="/bookings/farmer/:id" element={<ProtectedRoute role="farmer"><BookingDetails /></ProtectedRoute>} />

              {/* ✅ Owner view of farmer booking requests - both aliases */}
              <Route path="/owner/bookings" element={<ProtectedRoute role="owner"><BookingRequestsPage /></ProtectedRoute>} />
              <Route path="/booking-requests" element={<ProtectedRoute role="owner"><BookingRequestsPage /></ProtectedRoute>} />

              {/* Rental Form route */}
              <Route path="/rent/:equipmentId" element={<ProtectedRoute><RentalForm /></ProtectedRoute>} />

              {/* Rental History route */}
              <Route path="/rental-history" element={<ProtectedRoute><RentalHistory /></ProtectedRoute>} /> {/* Added Rental History Route */}

              {/* New route for Equipment Analytics */}
              <Route path="/equipment-analytics" element={<ProtectedRoute role="owner"><EquipmentAnalyticsPage /></ProtectedRoute>} /> {/* Added Analytics Route */}
            </Routes>
          </div>
          
          {/* Add the animated footer to all pages */}
          <AnimatedFooter />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
