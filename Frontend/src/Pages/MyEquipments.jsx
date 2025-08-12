import React, { useEffect, useState } from 'react';
import api from '../Services/api';
import { Link } from 'react-router-dom';
import './MyEquipments.css';

const EquipmentsPage = () => {
  const [equipmentList, setEquipmentList] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    availability: '',
    search: '',
    page: 1,
  });
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
    }
  }, []);

  useEffect(() => {
    fetchEquipments();
  }, [filters]);

  const fetchEquipments = async () => {
    try {
      const { data } = await api.get('/equipment', { params: filters });
      setEquipmentList(data.equipment);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this equipment?')) return;
    try {
      await api.delete(`/equipment/${id}`);
      fetchEquipments();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <div className="equipments-container">
      <h2 className="equipments-title">Available Equipments</h2>

      {/* Filters */}
      <div className="filters-container">
        <input
          type="text"
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
        >
          <option value="">All Categories</option>
          <option value="tractor">Tractor</option>
          <option value="harvester">Harvester</option>
          <option value="plow">Plow</option>
          <option value="seeder">Seeder</option>
          <option value="sprayer">Sprayer</option>
          <option value="irrigation">Irrigation</option>
          <option value="other">Other</option>
        </select>
        <input
          type="text"
          placeholder="Location"
          value={filters.location}
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
        />
        <select
          value={filters.availability}
          onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
        >
          <option value="">Any Availability</option>
          <option value="true">Available</option>
          <option value="false">Unavailable</option>
        </select>
      </div>

      {/* Equipment List */}
      {equipmentList.length > 0 ? (
        <div className="equipment-list">
          {equipmentList.map((eq) => (
            <div key={eq._id} className="equipment-card">
              <h3>{eq.name}</h3>
              <p>{eq.description}</p>
              <p>Location: {eq.location}</p>
              <p>Rate: ₹{eq.dailyRate}/day</p>
              <div className="action-buttons">
                <Link to={`/equipment/${eq._id}`} className="view-btn">
                  View
                </Link>
                {user?.role === 'owner' && eq.owner._id === user.id && (
                  <>
                    <Link to={`/edit-equipment/${eq._id}`} className="edit-btn">
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(eq._id)} className="delete-btn">
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No equipment found.</p>
      )}

      {/* Pagination */}
      <div className="pagination-container">
        {[...Array(pagination.pages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setFilters({ ...filters, page: i + 1 })}
            className={filters.page === i + 1 ? 'active' : ''}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EquipmentsPage;