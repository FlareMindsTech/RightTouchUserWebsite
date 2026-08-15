/**
 * Helper utility to share service/product details or current page link.
 * Uses Web Share API when available, otherwise falls back to copying link to clipboard.
 */
export const shareItem = async ({ title, text, url }, showToast) => {
  const shareUrl = url || window.location.href;
  const shareTitle = title || 'RightTouch Home Services';
  const shareText = text || 'Check out this service on RightTouch!';

  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
      return;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Share error:', err);
      } else {
        return;
      }
    }
  }

  // Fallback: Copy to clipboard
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareUrl);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    if (typeof showToast === 'function') {
      showToast('Link copied to clipboard!');
    } else {
      alert('Link copied to clipboard!');
    }
  } catch (err) {
    console.error('Failed to copy link:', err);
  }
};

/**
 * Share via WhatsApp
 */
export const shareViaWhatsApp = ({ title, text, url }, showToast) => {
  const shareUrl = url || window.location.href;
  const shareText = `${title || 'RightTouch Home Services'}\n${text || 'Check out this service on RightTouch!'}\n\n${shareUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  window.open(whatsappUrl, '_blank');
};

/**
 * Copy link to clipboard
 */
export const copyLink = async (url, showToast) => {
  const link = url || window.location.href;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(link);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    if (typeof showToast === 'function') {
      showToast('Link copied to clipboard!');
    } else {
      alert('Link copied to clipboard!');
    }
  } catch (err) {
    console.error('Failed to copy link:', err);
    if (typeof showToast === 'function') {
      showToast('Failed to copy link');
    }
  }
};

/**
 * Show share options (native share, WhatsApp, copy link)
 */
export const showShareOptions = ({ title, text, url }, showToast) => {
  const shareUrl = url || window.location.href;
  
  if (navigator.share) {
    shareItem({ title, text, url: shareUrl }, showToast);
    return;
  }

  // Fallback: create a simple share modal or use native options
  const shareText = `${title || 'RightTouch Home Services'}\n${text || 'Check out this service on RightTouch!'}\n\n${shareUrl}`;
  
  // Try WhatsApp first
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  
  // For mobile, we can show action sheet or just open WhatsApp
  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    window.open(whatsappUrl, '_blank');
  } else {
    // Desktop: copy to clipboard
    copyLink(shareUrl, showToast);
  }
};
