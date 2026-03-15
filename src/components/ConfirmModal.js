import React from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({
  isOpen,
  icon = '🗑️',
  iconBg = '#fee2e2',
  iconColor = '#ef4444',
  title = 'Are you sure?',
  desc = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Keep It',
  confirmClass = 'cm-confirm-danger',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="cm-overlay" onClick={onCancel}>
      <div className="cm-card" onClick={(e) => e.stopPropagation()}>
        <div className="cm-icon-wrap" style={{ background: iconBg, color: iconColor }}>
          {icon}
        </div>
        <h3 className="cm-title">{title}</h3>
        {desc && <p className="cm-desc">{desc}</p>}
        <div className="cm-actions">
          <button className="cm-btn cm-cancel" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            className={`cm-btn ${confirmClass}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
