import React, { useState, useEffect } from 'react';
import {
  MdClose,
  MdContentCopy,
  MdCheck,
  MdShare,
  MdEmail,
  MdChatBubbleOutline
} from 'react-icons/md';
import {
  FaWhatsapp,
  FaTelegram,
  FaXTwitter,
  FaFacebookF,
  FaLinkedinIn
} from 'react-icons/fa6';
import './ShareModal.css';

const ShareModal = ({ isOpen, onClose, shareData, showToast }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !shareData) return null;

  const url = shareData.url || window.location.href;
  const title = shareData.title || 'RightTouch Home Services & Products';
  const text = shareData.text || `Check out ${title} on RightTouch!`;
  const shareMessage = `${title}\n${text}\n\n${url}`;

  const isMobile = () => {
    if (typeof navigator === 'undefined') return false;
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const isIOS = () => {
    if (typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  };

  const openApp = (targetUrl) => {
    if (isMobile()) {
      window.location.href = targetUrl;
    } else {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      if (typeof showToast === 'function') {
        showToast('Link copied to clipboard!');
      }
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url
        });
        onClose();
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Native share failed:', err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const shareChannels = [
    {
      name: 'WhatsApp',
      icon: <FaWhatsapp />,
      color: '#25D366',
      bg: 'rgba(37, 211, 102, 0.12)',
      action: () => {
        openApp(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`);
      }
    },
    {
      name: 'Telegram',
      icon: <FaTelegram />,
      color: '#229ED9',
      bg: 'rgba(34, 158, 217, 0.12)',
      action: () => {
        openApp(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title + '\n' + text)}`);
      }
    },
    {
      name: 'X (Twitter)',
      icon: <FaXTwitter />,
      color: '#0f1419',
      bg: 'rgba(15, 20, 25, 0.1)',
      action: () => {
        openApp(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`);
      }
    },
    {
      name: 'Facebook',
      icon: <FaFacebookF />,
      color: '#1877F2',
      bg: 'rgba(24, 119, 242, 0.12)',
      action: () => {
        openApp(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
      }
    },
    {
      name: 'LinkedIn',
      icon: <FaLinkedinIn />,
      color: '#0A66C2',
      bg: 'rgba(10, 102, 194, 0.12)',
      action: () => {
        openApp(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
      }
    },
    {
      name: 'Email',
      icon: <MdEmail />,
      color: '#EA4335',
      bg: 'rgba(234, 67, 53, 0.12)',
      action: () => {
        window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareMessage)}`;
      }
    },
    {
      name: 'SMS',
      icon: <MdChatBubbleOutline />,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
      action: () => {
        const smsUrl = isIOS()
          ? `sms:&body=${encodeURIComponent(shareMessage)}`
          : `sms:?body=${encodeURIComponent(shareMessage)}`;
        window.location.href = smsUrl;
      }
    },
    ...(typeof navigator !== 'undefined' && navigator.share ? [
      {
        name: 'More Apps',
        icon: <MdShare />,
        color: '#6366f1',
        bg: 'rgba(99, 102, 241, 0.12)',
        action: handleNativeShare
      }
    ] : [])
  ];

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="share-modal-header">
          <div className="share-header-title-wrap">
            <span className="share-header-icon-badge">
              <MdShare />
            </span>
            <div>
              <h3 className="share-modal-title">Share</h3>
              <p className="share-modal-subtitle">Share this service or product with friends</p>
            </div>
          </div>
          <button className="share-modal-close-btn" onClick={onClose} aria-label="Close share dialog">
            <MdClose />
          </button>
        </div>

        {/* Item Preview Card */}
        {shareData.title && (
          <div className="share-preview-card">
            {shareData.image ? (
              <div className="share-preview-img-wrap">
                <img src={shareData.image} alt={shareData.title} />
              </div>
            ) : (
              <div className="share-preview-icon-wrap">
                ⚡
              </div>
            )}
            <div className="share-preview-info">
              <h4 className="share-preview-title">{shareData.title}</h4>
              <div className="share-preview-meta">
                {shareData.price && (
                  <span className="share-preview-price">₹{shareData.price}</span>
                )}
                {shareData.category && (
                  <span className="share-preview-cat">{shareData.category}</span>
                )}
                <span className="share-preview-badge">RightTouch Verified</span>
              </div>
            </div>
          </div>
        )}

        {/* Share Channels Grid */}
        <div className="share-channels-section">
          <span className="share-section-label">Share to apps</span>
          <div className="share-channels-grid">
            {shareChannels.map((channel, idx) => (
              <button
                key={idx}
                className="share-channel-btn"
                onClick={channel.action}
                style={{ '--channel-color': channel.color, '--channel-bg': channel.bg }}
              >
                <div className="channel-icon-circle">
                  {channel.icon}
                </div>
                <span className="channel-name">{channel.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Copy Link Section */}
        <div className="share-copy-section">
          <span className="share-section-label">Or copy link</span>
          <div className="share-copy-input-wrap">
            <input
              type="text"
              className="share-link-input"
              value={url}
              readOnly
              onClick={(e) => e.target.select()}
            />
            <button
              className={`share-copy-action-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopyLink}
            >
              {copied ? (
                <>
                  <MdCheck className="copy-btn-icon" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <MdContentCopy className="copy-btn-icon" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
