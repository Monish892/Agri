import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../Services/api';
import { useAuth } from '../Context/AuthContext';
import './EquipmentDetails.css';

const EquipmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [equipment, setEquipment] = useState(null);
  const [review, setReview] = useState({ rating: '', comment: '' });
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [replyContent, setReplyContent] = useState({});
  const [error, setError] = useState('');

  const isOwner = user?._id === equipment?.owner?._id;
  const isFarmer = user?.role === 'farmer';

  const fetchEquipment = async () => {
    try {
      const res = await api.get(`/equipment/${id}`);
      setEquipment(res.data.equipment);
    } catch (err) {
      setError('Failed to load equipment details');
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this equipment?')) {
      try {
        await api.delete(`/equipment/${id}`);
        navigate('/my-equipments');
      } catch (err) {
        alert('Delete failed');
      }
    }
  };

  const userReview = equipment?.reviews?.find((r) => r.user._id === user?._id);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!review.rating) return alert('Rating is required');

    try {
      if (editingReviewId) {
        await api.put(`/equipment/${id}/reviews/${editingReviewId}`, review);
      } else {
        await api.post(`/equipment/${id}/reviews`, review);
      }
      setReview({ rating: '', comment: '' });
      setEditingReviewId(null);
      fetchEquipment();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add review');
    }
  };

  const handleEditReview = (review) => {
    setReview({ rating: review.rating, comment: review.comment });
    setEditingReviewId(review._id);
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Delete your review?')) {
      try {
        await api.delete(`/equipment/${id}/reviews/${reviewId}`);
        fetchEquipment();
      } catch (err) {
        alert('Failed to delete review');
      }
    }
  };

  const handleReplySubmit = async (reviewId) => {
    try {
      await api.post(`/equipment/${id}/reviews/${reviewId}/reply`, {
        reply: replyContent[reviewId],
      });
      setReplyContent((prev) => ({ ...prev, [reviewId]: '' }));
      fetchEquipment();
    } catch (err) {
      alert('Reply failed');
    }
  };

  const getAverageRating = () => {
    const total = equipment.reviews.reduce((acc, r) => acc + r.rating, 0);
    return (total / equipment.reviews.length).toFixed(1);
  };

  if (!equipment) return <p className="equipment-loading">Loading equipment...</p>;

  return (
    <div className="equipment-details-container">
      <h1 className="equipment-title">{equipment.name}</h1>
      <p className="equipment-description">{equipment.description}</p>

      <div className="equipment-info">
        <p><strong>Category:</strong> {equipment.category}</p>
        <p><strong>Location:</strong> {equipment.location}</p>
        <p><strong>Daily Rate:</strong> ₹{equipment.dailyRate}</p>
        <p><strong>Weekly Rate:</strong> ₹{equipment.weeklyRate}</p>
        <p><strong>Monthly Rate:</strong> ₹{equipment.monthlyRate}</p>
        <p><strong>Available:</strong> {equipment.availability ? 'Yes' : 'No'}</p>
        <p><strong>Owner:</strong> {equipment.owner?.businessName || equipment.owner?.name}</p>
        <p><strong>Verified:</strong> {equipment.owner?.isVerified ? 'Yes' : 'No'}</p>
      </div>

      {equipment.features?.length > 0 && (
        <ul className="equipment-features">
          {equipment.features.map((feature, idx) => (
            <li key={idx}>{feature}</li>
          ))}
        </ul>
      )}

      {equipment.images?.length > 0 && (
        <div className="equipment-images">
          {equipment.images.map((img, i) => (
            <img key={i} src={`https://agri-xyu3.onrender.com${img}`} alt={`equipment-${i}`} />
          ))}
        </div>
      )}

      <div className="equipment-reviews">
        <h2 className="reviews-title">Reviews ({equipment.reviews.length})</h2>
        {equipment.reviews.length > 0 && (
          <p className="average-rating">⭐ Average Rating: {getAverageRating()} / 5</p>
        )}

        {equipment.reviews.length > 0 ? (
          equipment.reviews.map((r, idx) => (
            <div key={idx} className="review-card">
              <p className="review-user"><strong>{r.user.name}</strong></p>
              <p className="review-rating">⭐ {r.rating}</p>
              <p className="review-comment">{r.comment}</p>

              {r.reply && (
                <div className="review-reply">
                  <p><strong>Owner Reply:</strong> {r.reply}</p>
                </div>
              )}

              {user?._id === r.user._id && (
                <div className="review-actions">
                  <button
                    className="edit-review-btn"
                    onClick={() => handleEditReview(r)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-review-btn"
                    onClick={() => handleDeleteReview(r._id)}
                  >
                    Delete
                  </button>
                </div>
              )}

              {isOwner && !r.reply && (
                <div className="reply-section">
                  <textarea
                    value={replyContent[r._id] || ''}
                    onChange={(e) =>
                      setReplyContent({ ...replyContent, [r._id]: e.target.value })
                    }
                    placeholder="Write a reply..."
                  />
                  <button
                    onClick={() => handleReplySubmit(r._id)}
                    className="reply-btn"
                  >
                    Reply
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="no-reviews">No reviews yet.</p>
        )}
      </div>

      {isFarmer && !userReview && (
        <form onSubmit={handleReviewSubmit} className="review-form">
          <h2 className="form-title">{editingReviewId ? 'Edit Review' : 'Add a Review'}</h2>
          <select
            value={review.rating}
            onChange={(e) => setReview({ ...review, rating: e.target.value })}
            className="review-rating-input"
          >
            <option value="">Select Rating</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <textarea
            placeholder="Your comment"
            value={review.comment}
            onChange={(e) => setReview({ ...review, comment: e.target.value })}
            className="review-comment-input"
          />
          <button type="submit" className="submit-review-btn">
            {editingReviewId ? 'Update Review' : 'Submit Review'}
          </button>
        </form>
      )}

      {isOwner && (
        <div className="owner-actions">
          <button
            onClick={() => navigate(`/edit-equipment/${equipment._id}`)}
            className="edit-equipment-btn"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="delete-equipment-btn"
          >
            Delete
          </button>
        </div>
      )}

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default EquipmentDetails;