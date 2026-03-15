import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack, MdStar, MdStarBorder, MdEdit, MdDelete, MdClose, MdVerified } from 'react-icons/md';
import { getMyRatings, updateRating, deleteRating } from '../services/ratingService';
import ConfirmModal from '../components/ConfirmModal';
import { rtAlert } from '../components/RtAlert';
import './RatingsPage.css';

const StarDisplay = ({ value, size = 18 }) => (
  <span className="star-display">
    {[1, 2, 3, 4, 5].map(i => (
      i <= value
        ? <MdStar key={i} size={size} className="star-filled" />
        : <MdStarBorder key={i} size={size} className="star-empty" />
    ))}
  </span>
);

const StarPicker = ({ value, onChange }) => (
  <span className="star-picker">
    {[1, 2, 3, 4, 5].map(i => (
      <button
        key={i}
        type="button"
        className={`star-pick-btn ${i <= value ? 'active' : ''}`}
        onClick={() => onChange(i)}
      >
        ★
      </button>
    ))}
  </span>
);

const EMPTY_MESSAGES = [
  "Your first review is just a booking away!",
  "Complete a booking and share your experience.",
  "Help others by rating your technicians.",
];

export default function RatingsPage({ showToast }) {
  const navigate = useNavigate();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ rates: 0, comment: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    setLoading(true);
    try {
      const res = await getMyRatings();
      const list = Array.isArray(res?.result) ? res.result
        : Array.isArray(res?.data) ? res.data
        : Array.isArray(res) ? res : [];
      setRatings(list);
    } catch {
      setRatings([]);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (r) => {
    setEditingId(r._id);
    setEditForm({ rates: r.rates || 0, comment: r.comment || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ rates: 0, comment: '' });
  };

  const handleUpdate = async (id) => {
    if (!editForm.rates) { rtAlert('Please select a star rating', 'warning'); return; }
    setEditLoading(true);
    try {
      const res = await updateRating(id, { rates: editForm.rates, comment: editForm.comment });
      if (res?.success || res?.result) {
        rtAlert('Review updated!', 'success');
        await fetchRatings();
        cancelEdit();
      } else {
        rtAlert(res?.message || 'Failed to update review', 'error');
      }
    } catch {
      rtAlert('Error updating review', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteRating(deleteConfirm.id);
      rtAlert('Review deleted', 'success');
      setRatings(prev => prev.filter(r => r._id !== deleteConfirm.id));
    } catch {
      rtAlert('Error deleting review', 'error');
    } finally {
      setDeleteLoading(false);
      setDeleteConfirm({ open: false, id: null });
    }
  };

  const avgRating = ratings.length
    ? (ratings.reduce((sum, r) => sum + (r.rates || 0), 0) / ratings.length).toFixed(1)
    : null;

  return (
    <div className="rp-page">
      {/* Header */}
      <div className="rp-header">
        <button className="rp-back-btn" onClick={() => navigate('/account')}>
          <MdArrowBack size={22} />
        </button>
        <div>
          <h1 className="rp-title">My Reviews</h1>
          <p className="rp-subtitle">Your feedback helps improve the service</p>
        </div>
      </div>

      {/* Stats banner */}
      {!loading && ratings.length > 0 && (
        <div className="rp-stats">
          <div className="rp-stat-item">
            <span className="rp-stat-num">{ratings.length}</span>
            <span className="rp-stat-label">Total Reviews</span>
          </div>
          <div className="rp-stat-divider" />
          <div className="rp-stat-item">
            <MdStar size={20} className="star-filled" style={{ marginBottom: 2 }} />
            <span className="rp-stat-num">{avgRating}</span>
            <span className="rp-stat-label">Avg Rating</span>
          </div>
          <div className="rp-stat-divider" />
          <div className="rp-stat-item">
            <span className="rp-stat-num">{ratings.filter(r => r.rates >= 4).length}</span>
            <span className="rp-stat-label">Positive</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="rp-content">
        {loading ? (
          <div className="rp-skeletons">
            {[1, 2, 3].map(i => (
              <div key={i} className="rp-card rp-skeleton">
                <div className="sk-avatar" />
                <div className="sk-lines">
                  <div className="sk-line sk-w60" />
                  <div className="sk-line sk-w40" />
                  <div className="sk-line sk-w80" />
                </div>
              </div>
            ))}
          </div>
        ) : ratings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="rp-list">
            {ratings.map(r => (
              <div key={r._id} className="rp-card">
                {editingId === r._id ? (
                  <EditForm
                    form={editForm}
                    setForm={setEditForm}
                    onSave={() => handleUpdate(r._id)}
                    onCancel={cancelEdit}
                    loading={editLoading}
                  />
                ) : (
                  <ReviewCard
                    r={r}
                    onEdit={() => openEdit(r)}
                    onDelete={() => setDeleteConfirm({ open: true, id: r._id })}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteConfirm.open}
        icon="🗑️"
        iconBg="#fee2e2"
        iconColor="#ef4444"
        title="Delete Review?"
        desc="This review will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Keep It"
        confirmClass="cm-confirm-danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
        loading={deleteLoading}
      />
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────── */

function ReviewCard({ r, onEdit, onDelete }) {
  const techName = r.technicianId?.name || r.technicianId?.fname
    ? `${r.technicianId?.fname || ''} ${r.technicianId?.lname || ''}`.trim()
    : 'Technician';
  const serviceName = r.serviceId?.serviceName || r.bookingId?.service || 'Service';
  const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  return (
    <div className="rv-card">
      <div className="rv-top">
        <div className="rv-avatar">{techName.charAt(0).toUpperCase()}</div>
        <div className="rv-meta">
          <div className="rv-name">
            {techName}
            <MdVerified size={14} className="rv-verified" />
          </div>
          <div className="rv-service">{serviceName}</div>
          <StarDisplay value={r.rates || 0} size={16} />
        </div>
        <div className="rv-actions">
          <button className="rv-btn rv-edit-btn" onClick={onEdit} title="Edit">
            <MdEdit size={16} />
          </button>
          <button className="rv-btn rv-delete-btn" onClick={onDelete} title="Delete">
            <MdDelete size={16} />
          </button>
        </div>
      </div>
      {r.comment && <p className="rv-comment">"{r.comment}"</p>}
      {dateStr && <span className="rv-date">{dateStr}</span>}
    </div>
  );
}

function EditForm({ form, setForm, onSave, onCancel, loading }) {
  return (
    <div className="edit-form">
      <div className="edit-form-header">
        <span className="edit-form-label">Edit Your Review</span>
        <button className="rv-btn" onClick={onCancel}><MdClose size={16} /></button>
      </div>
      <StarPicker value={form.rates} onChange={v => setForm(f => ({ ...f, rates: v }))} />
      <textarea
        className="edit-textarea"
        value={form.comment}
        onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
        placeholder="Update your comment..."
        rows={3}
      />
      <div className="edit-actions">
        <button className="edit-cancel-btn" onClick={onCancel} disabled={loading}>Cancel</button>
        <button className="edit-save-btn" onClick={onSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rp-empty">
      <div className="rp-empty-stars">
        {[1, 2, 3, 4, 5].map(i => (
          <MdStar key={i} size={32} className="empty-star" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
      <h3 className="rp-empty-title">No Reviews Yet</h3>
      <p className="rp-empty-desc">{EMPTY_MESSAGES[0]}</p>
      <div className="rp-empty-steps">
        {[
          { step: '1', text: 'Book a service' },
          { step: '2', text: 'Get it completed' },
          { step: '3', text: 'Rate your technician' },
        ].map(s => (
          <div key={s.step} className="rp-step">
            <div className="rp-step-num">{s.step}</div>
            <span>{s.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
