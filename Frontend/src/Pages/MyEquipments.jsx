import React, { useEffect, useState } from 'react';
import api from '../Services/api';
import { Link, useNavigate } from 'react-router-dom';
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
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    location: '',
    dailyRate: '',
    category: '',
    availability: true,
  });
  const navigate = useNavigate();

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

  const handleEditClick = (eq) => {
    setEditId(eq._id);
    setEditData({
      name: eq.name,
      description: eq.description,
      location: eq.location,
      dailyRate: eq.dailyRate,
      category: eq.category,
      availability: eq.availability,
    });
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/equipment/${editId}`, editData);
      setEditId(null);
      fetchEquipments();
    } catch (error) {
      console.error('Edit failed:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditId(null);
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
              {editId === eq._id ? (
                <form className="edit-equipment-form" onSubmit={handleEditSubmit}>
                  <input
                    type="text"
                    name="name"
                    value={editData.name}
                    onChange={handleEditChange}
                    placeholder="Name"
                    required
                  />
                  <textarea
                    name="description"
                    value={editData.description}
                    onChange={handleEditChange}
                    placeholder="Description"
                    required
                  />
                  <input
                    type="text"
                    name="location"
                    value={editData.location}
                    onChange={handleEditChange}
                    placeholder="Location"
                    required
                  />
                  <input
                    type="number"
                    name="dailyRate"
                    value={editData.dailyRate}
                    onChange={handleEditChange}
                    placeholder="Daily Rate"
                    required
                  />
                  <select
                    name="category"
                    value={editData.category}
                    onChange={handleEditChange}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="tractor">Tractor</option>
                    <option value="harvester">Harvester</option>
                    <option value="plow">Plow</option>
                    <option value="seeder">Seeder</option>
                    <option value="sprayer">Sprayer</option>
                    <option value="irrigation">Irrigation</option>
                    <option value="other">Other</option>
                  </select>
                  <label>
                    <input
                      type="checkbox"
                      name="availability"
                      checked={editData.availability}
                      onChange={handleEditChange}
                    />
                    Available
                  </label>
                  <div className="edit-actions">
                    <button type="submit" className="save-btn">Save</button>
                    <button type="button" className="cancel-btn" onClick={handleCancelEdit}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
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
                        <button onClick={() => handleEditClick(eq)} className="edit-btn">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(eq._id)} className="delete-btn">
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
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