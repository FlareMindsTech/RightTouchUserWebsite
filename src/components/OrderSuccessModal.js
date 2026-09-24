import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdCheck,
  MdClose,
  MdContentCopy,
  MdCalendarToday,
  MdLocationOn,
  MdAccessTime,
  MdArrowForward
} from 'react-icons/md';
import './OrderSuccessModal.css';

const OrderSuccessModal = ({
  isOpen,
  onClose,
  data,
  autoCloseDuration = 8000
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && autoCloseDuration > 0) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseDuration, onClose]);

  if (!isOpen) return null;

  const bookingId = data?.bookingId || data?._id || data?.id || '';
  const displayId = bookingId ? (bookingId.startsWith('#') ? bookingId : `#${bookingId.slice(-8).toUpperCase()}`) : '';
  const scheduledDate = data?.scheduledDate || data?.scheduledAt || '';
  const scheduledTime = data?.scheduledTime || '';
  const addressLine = data?.addressLine || data?.address || '';
  const isInstant = data?.bookingType === 'instant' || (!scheduledDate && !scheduledTime);

  const handleCopyId = () => {
    if (!bookingId) return;
    navigator.clipboard.writeText(bookingId.replace('#', ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTrackBookings = () => {
    if (onClose) onClose();
    navigate('/bookings');
  };

  const handleExploreServices = () => {
    if (onClose) onClose();
    navigate('/services');
  };

  return (
    <div className="order-success-overlay" onClick={onClose}>
      <div className="order-success-card" onClick={(e) => e.stopPropagation()}>
        <button className="order-success-close-btn" onClick={onClose} aria-label="Close modal">
          <MdClose />
        </button>

        {/* Floating Celebration Particles */}
        <div className="order-celebration-particles" aria-hidden="true">
          <span className="order-particle op1">✨</span>
          <span className="order-particle op2">🎉</span>
          <span className="order-particle op3">⭐</span>
          <span className="order-particle op4">🎊</span>
          <span className="order-particle op5">✨</span>
          <span className="order-particle op6">🌟</span>
        </div>

        {/* Hero Animated Radar Ripple & SVG Drawing Checkmark */}
        <div className="order-success-hero-wrap">
          <div className="order-pulse-ring oring-1"></div>
          <div className="order-pulse-ring oring-2"></div>
          <div className="order-pulse-ring oring-3"></div>

          <div className="order-svg-circle-wrap">
            <svg className="order-checkmark-svg" viewBox="0 0 80 80">
              <circle className="order-circle-bg" cx="40" cy="40" r="36" />
              <circle className="order-circle-outline" cx="40" cy="40" r="36" />
              <path className="order-check-path" d="M24 41 L35 52 L56 29" />
            </svg>
          </div>
        </div>

        {/* Modal Body */}
        <div className="order-success-body">
          <div className="order-success-badge-pill">
            <span className="order-badge-sparkle">✨</span> Order Confirmed
          </div>
          <h2 className="order-success-title">Order Placed Successfully!</h2>
          <p className="order-success-desc">
            Your service appointment is confirmed. Our certified technician will arrive at your doorstep on time.
          </p>

          {/* Reference ID Card */}
          {displayId && (
            <div className="order-ref-card">
              <span className="order-ref-label">Booking Reference</span>
              <div className="order-ref-code-wrap">
                <span className="order-ref-code">{displayId}</span>
                <button
                  type="button"
                  className={`order-ref-copy-btn ${copied ? 'copied' : ''}`}
                  onClick={handleCopyId}
                  title="Copy Reference ID"
                >
                  {copied ? (
                    <>
                      <MdCheck style={{ color: '#16a34a', fontSize: '15px' }} /> Copied!
                    </>
                  ) : (
                    <>
                      <MdContentCopy style={{ fontSize: '13px' }} /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Quick Snapshot Details */}
          {(isInstant || scheduledDate || addressLine) && (
            <div className="order-snapshot-info-box">
              <div className="order-snapshot-row">
                <MdAccessTime />
                <span>
                  <strong>Schedule:</strong> {isInstant ? '⚡ Instant Service (Within 2 Hours)' : `${scheduledDate} ${scheduledTime ? `(${scheduledTime})` : ''}`}
                </span>
              </div>
              {addressLine && (
                <div className="order-snapshot-row">
                  <MdLocationOn />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <strong>Address:</strong> {addressLine}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Feature Assurances */}
          <div className="order-assurance-grid">
            <div className="order-assurance-item">
              <span className="order-assurance-icon">⚡</span>
              <div className="order-assurance-text">
                <strong>2-Hour Arrival</strong>
                <span>Fast doorstep delivery</span>
              </div>
            </div>
            <div className="order-assurance-item">
              <span className="order-assurance-icon">🛡️</span>
              <div className="order-assurance-text">
                <strong>30-Day Warranty</strong>
                <span>Free rework guarantee</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="order-success-actions">
            <button type="button" className="order-btn-primary" onClick={handleTrackBookings}>
              <MdCalendarToday style={{ fontSize: '17px' }} />
              <span>Track My Bookings</span>
              <MdArrowForward style={{ fontSize: '17px' }} />
            </button>
            <button type="button" className="order-btn-secondary" onClick={handleExploreServices}>
              Explore More Services
            </button>
          </div>
        </div>

        {/* Auto-Dismiss Timer Bar */}
        {autoCloseDuration > 0 && (
          <div className="order-progress-bar-wrap">
            <div className="order-progress-bar" style={{ animationDuration: `${autoCloseDuration}ms` }}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSuccessModal;
