import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../Services/api';
import './BrowseEquipment.css';   

const BrowseEquipment = () => {
  const [equipment, setEquipment] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    search: '',
    sortBy: '',
    page: 1
  });
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories] = useState([
    { value: 'tractor', label: 'Tractor', icon: '🚜' },
    { value: 'harvester', label: 'Harvester', icon: '🌾' },
    { value: 'plow', label: 'Plow', icon: '⚒️' },
    { value: 'seeder', label: 'Seeder', icon: '🌱' },
    { value: 'sprayer', label: 'Sprayer', icon: '💦' },
    { value: 'irrigation', label: 'Irrigation', icon: '💧' },
    { value: 'other', label: 'Other', icon: '🔧' }
  ]);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserRole(payload.role);
    }
    
    // Add page animation
    document.querySelector('.page-container').classList.add('animate-fade-in');
  }, []);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const res = await api.get('/equipment', {
        params: {
          ...filters,
          limit: 6
        }
      });
      setEquipment(res.data.equipment);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Error fetching equipment:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEquipment();
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this equipment?')) return;
    try {
      await api.delete(`/equipment/${id}`);
      fetchEquipment();
    } catch (err) {
      console.error('Error deleting equipment:', err);
    }
  };

  const handleResetFilters = () => {
    setFilters({ category: '', location: '', search: '', sortBy: '', page: 1 });
    // Add button animation
    document.querySelector('.reset-btn').classList.add('animate-pulse');
    setTimeout(() => {
      document.querySelector('.reset-btn').classList.remove('animate-pulse');
    }, 1000);
  };

  const handleBookNow = (id) => {
    navigate(`/create-booking/${id}`);
  };

  // Get category icon
  const getCategoryIcon = (categoryValue) => {
    const category = categories.find(cat => cat.value === categoryValue);
    return category ? category.icon : '🔧';
  };

  return (
      <div className="browse-equipment page-container min-h-screen p-4 max-w-7xl mx-auto">      <div className="bubble"></div>
      <div className="bubble"></div>
      <div className="bubble"></div>

      <h1 className="text-2xl font-bold mb-6 animate-fade-in">Browse Agricultural Equipment</h1>

      <div className="card card-blue mb-6 animate-fade-in">
        <div className="card-header">
          <h3>Search & Filter</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="form-floating">
            <input
              type="text"
              id="search"
              name="search"
              placeholder=" "
              value={filters.search}
              onChange={handleFilterChange}
              className="form-control"
            />
            <label htmlFor="search" className="form-label">Search Equipment...</label>
          </div>
          
          <div className="form-floating">
            <select 
              id="category"
              name="category" 
              value={filters.category} 
              onChange={handleFilterChange} 
              className="form-control"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
              ))}
            </select>
            <label htmlFor="category" className="form-label">Category</label>
          </div>
          
          <div className="form-floating">
            <input
              type="text"
              id="location"
              name="location"
              placeholder=" "
              value={filters.location}
              onChange={handleFilterChange}
              className="form-control"
            />
            <label htmlFor="location" className="form-label">Location</label>
          </div>
          
          <div className="form-floating">
            <select 
              id="sortBy"
              name="sortBy" 
              value={filters.sortBy} 
              onChange={handleFilterChange} 
              className="form-control"
            >
              <option value="">Sort by</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Rating</option>
            </select>
            <label htmlFor="sortBy" className="form-label">Sort by</label>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="badge badge-info">
            <span>Total Equipment: {pagination.total}</span>
          </div>
          <button 
            onClick={handleResetFilters} 
            className="btn btn-outline reset-btn"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      ) : equipment.length === 0 ? (
        <div className="alert alert-info">
          <div className="alert-icon">ℹ️</div>
          <div>No equipment available with the selected filters. Try adjusting your search criteria.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {equipment.map((item, index) => (
            <div 
              key={item._id} 
              className={`dashboard-card stagger-item`}
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <Link to={`/equipment/${item._id}`} className="block w-full">
                <div className="relative mb-3 overflow-hidden rounded-lg" style={{height: "200px"}}>
                  {item.images?.[0] ? (
                    <img 
                    src={`http://localhost:5000${item.images[0]}`} 

                    alt={item.name} 
                    className="w-full h-full object-cover transition-transform hover:scale-105" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                      No image available
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className="badge badge-primary">{getCategoryIcon(item.category)} {item.category}</span>
                  </div>
                </div>
                
                <h2 className="text-lg font-semibold mb-2">{item.name}</h2>
                
                <div className="flex justify-between items-center mb-2">
                  <p className="text-green-700 font-bold text-xl">₹{item.dailyRate}/day</p>
                  <p className="text-sm text-accent-dark">{item.location}</p>
                </div>
              </Link>

              {userRole === 'owner' && (
                <div className="flex space-x-2 mt-3">
                  <Link to={`/equipment/edit/${item._id}`} className="btn btn-secondary flex-1">Edit</Link>
                  <button onClick={() => handleDelete(item._id)} className="btn btn-danger flex-1">Delete</button>
                </div>
              )}

              {userRole === 'farmer' && (
                <button
                  onClick={() => handleBookNow(item._id)}
                  className="btn btn-primary mt-3 w-full"
                >
                  Book Now
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          <button 
            onClick={() => handlePageChange(Math.max(1, filters.page - 1))}
            disabled={filters.page === 1}
            className={`btn btn-outline ${filters.page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            &laquo; Prev
          </button>
          
          {pagination.pages <= 5 ? (
            // If 5 or fewer pages, show all
            Array.from({ length: pagination.pages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => handlePageChange(i + 1)}
                className={`btn ${filters.page === i + 1 ? 'btn-primary' : 'btn-outline'}`}
              >
                {i + 1}
              </button>
            ))
          ) : (
            // If more than 5 pages, show current, first, last, and neighbors
            <>
              {filters.page > 2 && (
                <button onClick={() => handlePageChange(1)} className="btn btn-outline">1</button>
              )}
              
              {filters.page > 3 && <span className="px-2">...</span>}
              
              {filters.page > 1 && (
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  className="btn btn-outline"
                >
                  {filters.page - 1}
                </button>
              )}
              
              <button className="btn btn-primary">{filters.page}</button>
              
              {filters.page < pagination.pages && (
                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  className="btn btn-outline"
                >
                  {filters.page + 1}
                </button>
              )}
              
              {filters.page < pagination.pages - 2 && <span className="px-2">...</span>}
              
              {filters.page < pagination.pages - 1 && (
                <button
                  onClick={() => handlePageChange(pagination.pages)}
                  className="btn btn-outline"
                >
                  {pagination.pages}
                </button>
              )}
            </>
          )}
          
          <button 
            onClick={() => handlePageChange(Math.min(pagination.pages, filters.page + 1))}
            disabled={filters.page === pagination.pages}
            className={`btn btn-outline ${filters.page === pagination.pages ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Next &raquo;
          </button>
        </div>
      )}
    </div>
  );
};

export default BrowseEquipment;