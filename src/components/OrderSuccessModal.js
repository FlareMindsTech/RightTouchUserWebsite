import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdCheck,
  MdClose,
  MdContentCopy,
  MdCalendarToday,
  MdLocationOn,
  MdAccessTime,
  MdArrowForward,
  MdElectricBolt,
  MdVerified,
  MdVolumeUp,
  MdVolumeOff,
  MdShare,
  MdShoppingBag
} from 'react-icons/md';
import { shareItem } from '../utils/share';
import './OrderSuccessModal.css';

/**
 * Web Audio Synthesizer for pleasant celebration chime (zero external dependencies)
 */
const playSuccessChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const startTime = ctx.currentTime + 0.05;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.09);

      gain.gain.setValueAtTime(0, startTime + idx * 0.09);
      gain.gain.linearRampToValueAtTime(0.18, startTime + idx * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + idx * 0.09 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + idx * 0.09);
      osc.stop(startTime + idx * 0.09 + 0.5);
    });
  } catch {
    // Gracefully ignore audio errors (e.g. autoplay block)
  }
};

const OrderSuccessModal = ({
  isOpen,
  onClose,
  data,
  autoCloseDuration = 9000
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const particlesRef = useRef([]);

  // Auto-close countdown management with pause on hover
  useEffect(() => {
    if (!isOpen || autoCloseDuration <= 0 || isPaused) return;

    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, autoCloseDuration);

    return () => clearTimeout(timer);
  }, [isOpen, autoCloseDuration, isPaused, onClose]);

  // Audio chime trigger on opening
  useEffect(() => {
    if (isOpen && soundEnabled) {
      const audioTimer = setTimeout(() => {
        playSuccessChime();
      }, 150);
      return () => clearTimeout(audioTimer);
    }
  }, [isOpen, soundEnabled]);

  // High performance Canvas Confetti & Ribbon Physics System
  const triggerConfettiBurst = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = [
      '#22c55e', '#16a34a', '#3b82f6', '#06b6d4', 
      '#eab308', '#f97316', '#ec4899', '#8b5cf6', '#10b981'
    ];

    const particleCount = 75;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.6;
      const speed = 4 + Math.random() * 8;
      const size = 6 + Math.random() * 8;
      const shapeType = Math.random() > 0.4 ? 'rect' : Math.random() > 0.5 ? 'circle' : 'star';

      particles.push({
        x: width / 2,
        y: height * 0.28,
        vx: Math.cos(angle) * speed * (0.8 + Math.random() * 0.7),
        vy: Math.sin(angle) * speed - (3 + Math.random() * 4),
        gravity: 0.18 + Math.random() * 0.08,
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        opacity: 1,
        shapeType,
        decay: 0.007 + Math.random() * 0.009
      });
    }

    particlesRef.current = particles;

    let startTime = performance.now();

    const draw = (currentTime) => {
      ctx.clearRect(0, 0, width, height);

      let aliveCount = 0;
      particles.forEach((p) => {
        if (p.opacity <= 0) return;
        aliveCount++;

        p.x += p.vx;
        p.vy += p.gravity;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity -= p.decay;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;

        if (p.shapeType === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else if (p.shapeType === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Draw mini star
          ctx.beginPath();
          for (let s = 0; s < 5; s++) {
            ctx.lineTo(
              Math.cos(((18 + s * 72) * Math.PI) / 180) * (p.size / 1.5),
              -Math.sin(((18 + s * 72) * Math.PI) / 180) * (p.size / 1.5)
            );
            ctx.lineTo(
              Math.cos(((54 + s * 72) * Math.PI) / 180) * (p.size / 3),
              -Math.sin(((54 + s * 72) * Math.PI) / 180) * (p.size / 3)
            );
          }
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      });

      if (aliveCount > 0 && currentTime - startTime < 4500) {
        animFrameRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    animFrameRef.current = requestAnimationFrame(draw);
  }, []);

  // Launch confetti when modal opens
  useEffect(() => {
    if (isOpen) {
      const burstTimer = setTimeout(() => {
        triggerConfettiBurst();
      }, 200);
      return () => {
        clearTimeout(burstTimer);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }
  }, [isOpen, triggerConfettiBurst]);

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

  // Extract booking information smoothly
  const rawId = data?.bookingId || data?._id || data?.id || '';
  const displayId = rawId
    ? rawId.startsWith('#')
      ? rawId
      : `#RT-${String(rawId).slice(-6).toUpperCase()}`
    : '#RT-CONFIRMED';

  const scheduledDate = data?.scheduledDate || data?.scheduledAt || '';
  const scheduledTime = data?.scheduledTime || '';
  const addressLine = data?.addressLine || data?.address || '';
  const isInstant = data?.bookingType === 'instant' || (!scheduledDate && !scheduledTime);
  const itemCount = data?.itemCount || data?.items?.length || 0;
  const totalAmount = data?.totalAmount || data?.amount || data?.total;

  const handleCopyId = () => {
    if (!rawId && !displayId) return;
    const cleanId = (displayId || rawId).replace('#', '');
    navigator.clipboard.writeText(cleanId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleTrackBookings = () => {
    if (onClose) onClose();
    navigate('/bookings');
  };

  const handleExploreServices = () => {
    if (onClose) onClose();
    navigate('/services');
  };

  const handleShareBooking = () => {
    shareItem({
      title: 'RightTouch Booking Confirmed',
      text: `My RightTouch service booking ${displayId} is confirmed! Experience doorstep appliance & home care with RightTouch.`,
      url: window.location.origin + '/bookings'
    });
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
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Canvas for Physics Confetti Particle Cannon */}
        <canvas ref={canvasRef} className="rt-booking-canvas" />

        {/* Ambient Top Controls */}
        <div className="rt-modal-top-bar">
          <button
            type="button"
            className="rt-top-icon-btn"
            onClick={() => setSoundEnabled((prev) => !prev)}
            title={soundEnabled ? 'Mute Celebration Sound' : 'Enable Celebration Sound'}
            aria-label="Toggle Sound"
          >
            {soundEnabled ? <MdVolumeUp /> : <MdVolumeOff />}
          </button>

          <button
            type="button"
            className="rt-top-icon-btn rt-celebrate-btn"
            onClick={triggerConfettiBurst}
            title="Replay Celebration Confetti"
          >
            <span className="rt-sparkle-spin">✨</span> Celebrate
          </button>

          <button
            type="button"
            className="rt-top-icon-btn rt-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <MdClose />
          </button>
        </div>

        {/* Floating Ambient Glow Orbs */}
        <div className="rt-ambient-glow" aria-hidden="true"></div>

        {/* Hero Animated 3D Ripple & Drawing SVG Checkmark */}
        <div className="rt-hero-animation-section">
          <div className="rt-sonar-wave wave-1"></div>
          <div className="rt-sonar-wave wave-2"></div>
          <div className="rt-sonar-wave wave-3"></div>

          {/* Holographic Glowing Checkmark Circle */}
          <div className="rt-badge-sphere">
            <div className="rt-badge-shimmer"></div>
            <svg className="rt-checkmark-svg" viewBox="0 0 100 100">
              <circle className="rt-circle-bg" cx="50" cy="50" r="44" />
              <circle className="rt-circle-pulse-track" cx="50" cy="50" r="44" />
              <path
                className="rt-check-draw-path"
                d="M30 52 L43 65 L70 36"
              />
            </svg>
            <div className="rt-badge-sparkle-dot dot-1"></div>
            <div className="rt-badge-sparkle-dot dot-2"></div>
            <div className="rt-badge-sparkle-dot dot-3"></div>
          </div>
        </div>

        {/* Header Titles */}
        <div className="rt-modal-header">
          <div className="rt-pill-status">
            <MdVerified className="rt-pill-icon" />
            <span>Booking Confirmed</span>
          </div>
          <h2 className="rt-modal-heading">Woohoo! Order Placed</h2>
          <p className="rt-modal-subtext">
            Your service request is locked in. We’re dispatching a certified RightTouch pro to your doorstep.
          </p>
        </div>

        {/* Live Real-Time Stepper Progress Tracker */}
        <div className="rt-stepper-tracker">
          <div className="rt-step-node completed">
            <div className="rt-node-icon">
              <MdCheck />
            </div>
            <span className="rt-node-text">Placed</span>
          </div>
          <div className="rt-step-line active">
            <div className="rt-step-line-fill"></div>
          </div>
          <div className="rt-step-node active">
            <div className="rt-node-icon pulse-active">
              <span className="rt-radar-ping"></span>
              <MdElectricBolt />
            </div>
            <span className="rt-node-text">Pro Assigning</span>
          </div>
          <div className="rt-step-line">
            <div className="rt-step-line-fill"></div>
          </div>
          <div className="rt-step-node pending">
            <div className="rt-node-icon">
              <MdAccessTime />
            </div>
            <span className="rt-node-text">{isInstant ? '2h Express' : 'Doorstep'}</span>
          </div>
        </div>

        {/* Digital Boarding Pass Ticket Card */}
        <div className="rt-ticket-card">
          <div className="rt-ticket-notch notch-left"></div>
          <div className="rt-ticket-notch notch-right"></div>

          {/* Reference ID Bar */}
          <div className="rt-ticket-top">
            <div className="rt-ticket-ref-group">
              <span className="rt-ticket-label">BOOKING ID</span>
              <span className="rt-ticket-code">{displayId}</span>
            </div>
            <button
              type="button"
              className={`rt-ticket-copy-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopyId}
              title="Copy Reference Code"
            >
              {copied ? (
                <>
                  <MdCheck className="rt-copy-icon" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <MdContentCopy className="rt-copy-icon" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="rt-ticket-divider"></div>

          {/* Ticket Information Rows */}
          <div className="rt-ticket-details">
            <div className="rt-detail-row">
              <div className="rt-detail-icon-wrap">
                <MdAccessTime />
              </div>
              <div className="rt-detail-info">
                <span className="rt-info-title">Service Slot</span>
                <span className="rt-info-val">
                  {isInstant ? (
                    <strong className="rt-instant-tag">⚡ Instant Express (Within 2 Hours)</strong>
                  ) : (
                    <span>
                      {scheduledDate} {scheduledTime ? `• ${scheduledTime}` : ''}
                    </span>
                  )}
                </span>
              </div>
            </div>

            {addressLine && (
              <div className="rt-detail-row">
                <div className="rt-detail-icon-wrap">
                  <MdLocationOn />
                </div>
                <div className="rt-detail-info">
                  <span className="rt-info-title">Service Location</span>
                  <span className="rt-info-val text-truncate">{addressLine}</span>
                </div>
              </div>
            )}

            {(itemCount > 0 || totalAmount) && (
              <div className="rt-detail-row">
                <div className="rt-detail-icon-wrap">
                  <MdShoppingBag />
                </div>
                <div className="rt-detail-info">
                  <span className="rt-info-title">Order Details</span>
                  <span className="rt-info-val">
                    {itemCount > 0 ? `${itemCount} Service Item${itemCount > 1 ? 's' : ''}` : ''}
                    {itemCount > 0 && totalAmount ? ' • ' : ''}
                    {totalAmount ? `₹${totalAmount}` : ''}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RightTouch Assurances Grid */}
        <div className="rt-guarantee-grid">
          <div className="rt-guarantee-card">
            <div className="rt-guarantee-icon">⚡</div>
            <div className="rt-guarantee-meta">
              <h6>2-Hour Express</h6>
              <p>On-time technician arrival</p>
            </div>
          </div>
          <div className="rt-guarantee-card">
            <div className="rt-guarantee-icon">🛡️</div>
            <div className="rt-guarantee-meta">
              <h6>30-Day Warranty</h6>
              <p>100% Free rework guarantee</p>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
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

          <div className="rt-action-subgroup">
            <button
              type="button"
              className="rt-btn-sub rt-btn-share"
              onClick={handleShareBooking}
              title="Share Booking"
            >
              <MdShare />
              <span>Share</span>
            </button>
            <button
              type="button"
              className="rt-btn-sub rt-btn-services"
              onClick={handleExploreServices}
            >
              <span>Explore More</span>
            </button>
          </div>
        </div>

        {/* Auto Close Dynamic Progress Bar */}
        {autoCloseDuration > 0 && (
          <div className="rt-countdown-track" title={isPaused ? 'Paused on hover' : 'Auto closing...'}>
            <div
              className={`rt-countdown-fill ${isPaused ? 'paused' : ''}`}
              style={{ animationDuration: `${autoCloseDuration}ms` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSuccessModal;
