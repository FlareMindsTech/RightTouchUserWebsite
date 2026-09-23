/**
 * Helper utility to trigger the RightTouch interactive Share Modal.
 * Emits a custom window event that is caught globally in App.js to display the Share Modal.
 */
export const shareItem = async ({ title, text, url, image, price, category }, showToast) => {
  const shareUrl = url || window.location.href;
  const shareTitle = title || 'RightTouch Services & Products';
  const shareText = text || `Check out ${shareTitle} on RightTouch!`;

  // Dispatch custom event to open the modern interactive Share Modal
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('open-share-modal', {
        detail: {
          title: shareTitle,
          text: shareText,
          url: shareUrl,
          image,
          price,
          category
        }
      })
    );
  }
};

/**
 * Open Share Modal explicitly
 */
export const openShareModal = (shareData) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('open-share-modal', {
        detail: shareData
      })
    );
  }
};

/**
 * Share via WhatsApp
 */
export const shareViaWhatsApp = ({ title, text, url }) => {
  const shareUrl = url || window.location.href;
  const shareText = `${title || 'RightTouch Home Services'}\n${text || 'Check out this service on RightTouch!'}\n\n${shareUrl}`;
  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  if (isMobile) {
    window.location.href = whatsappUrl;
  } else {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }
};

/**
 * Copy link directly to clipboard with user feedback
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
    }
  } catch (err) {
    console.error('Failed to copy link:', err);
    if (typeof showToast === 'function') {
      showToast('Failed to copy link');
    }
  }
};

/**
 * Show share options (triggers modal)
 */
export const showShareOptions = (data, showToast) => {
  shareItem(data, showToast);
};
