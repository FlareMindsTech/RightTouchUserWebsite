import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdCheck,
  MdClose,
  MdCalendarToday,
  MdArrowForward,
  MdVerified,
  MdHomeRepairService,
  MdShield,
  MdAccessTime,
  MdStorefront
} from 'react-icons/md';
import './OrderSuccessModal.css';

const OrderSuccessModal = ({
  isOpen,
  onClose,
  autoCloseDuration = 8000
}) => {
  const navigate = useNavigate();

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (onClose) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTrackBookings = () => {
    if (onClose) onClose();
    navigate('/bookings');
  };

  const handleExploreServices = () => {
    if (onClose) onClose();
    navigate('/services');
  };

  return (
    <div
      className="rt-booking-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Booking Confirmation"
    >
      <div
        className="rt-booking-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Minimal Close Button */}
        <div className="rt-modal-top-bar-simple">
          <button
            type="button"
            className="rt-close-btn-clean"
            onClick={onClose}
            aria-label="Close modal"
          >
            <MdClose />
          </button>
        </div>

        {/* Ambient Glow */}
        <div className="rt-ambient-glow" aria-hidden="true"></div>

        {/* Hero Checkmark Badge */}
        <div className="rt-hero-section">
          <div className="rt-sonar-ring ring-1"></div>
          <div className="rt-sonar-ring ring-2"></div>
          <div className="rt-hero-circle">
            <MdCheck className="rt-hero-check" />
          </div>
        </div>

        {/* Status & Title */}
        <div className="rt-modal-header">
          <div className="rt-pill-status">
            <MdVerified className="rt-pill-icon" />
            <span>Booking Confirmed</span>
          </div>
          <h2 className="rt-modal-heading">Woohoo! Order Placed</h2>
        </div>

        {/* 🌟 UNIQUE PROFESSIONAL ANIMATED BOOKING CARD 🌟 */}
        <div className="rt-pro-booking-anim-card">
          <div className="rt-orbit-container">
            {/* Pulsing Central Hub */}
            <div className="rt-hub-core">
              <div className="rt-hub-wave"></div>
              <div className="rt-hub-icon-wrap">
                <MdHomeRepairService className="rt-hub-icon" />
              </div>
            </div>

            {/* Orbit Ring with Traveling Satellite Icons */}
            <div className="rt-orbit-ring">
              <div className="rt-satellite sat-1" title="Doorstep Care">
                <MdStorefront />
              </div>
              <div className="rt-satellite sat-2" title="On-Time Arrival">
                <MdAccessTime />
              </div>
              <div className="rt-satellite sat-3" title="Service Warranty">
                <MdShield />
              </div>
            </div>
          </div>

          {/* Dynamic Live Status Indicator */}
          <div className="rt-status-pill-live">
            <span className="rt-live-glow-dot"></span>
            <span className="rt-live-pill-text">Service Confirmed • Dispatching Pro</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="rt-action-group">
          <button
            type="button"
            className="rt-btn-track"
            onClick={handleTrackBookings}
          >
            <MdCalendarToday className="rt-btn-icon" />
            <span>Track Booking Status</span>
            <MdArrowForward className="rt-btn-arrow" />
          </button>

          <button
            type="button"
            className="rt-btn-explore"
            onClick={handleExploreServices}
          >
            <span>Explore Services</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessModal;
