import React from 'react';
import { useRazorpayPayment } from '../hooks/useRazorpayPayment';
import { MdPayment, MdCheckCircle } from 'react-icons/md';
import { Loader2 } from 'lucide-react';
import './PayNowButton.css';

export const PayNowButton = ({
  booking,
  customerUser,
  onPaymentSuccess,
  onPaymentFailure,
  className = '',
  style = {},
  variant = 'primary', // 'primary' | 'compact'
}) => {
  const { initiatePayment, loading, error } = useRazorpayPayment();

  const handlePay = () => {
    if (!booking?._id && !booking?.id) return;

    initiatePayment({
      bookingId: booking._id || booking.id,
      customerUser,
      onSuccess: (res) => {
        if (onPaymentSuccess) onPaymentSuccess(res);
      },
      onFailure: (err) => {
        if (onPaymentFailure) onPaymentFailure(err);
      },
    });
  };

  const isPaid = (booking?.paymentStatus || '').toLowerCase() === 'paid';
  const statusUpper = (booking?.status || '').toUpperCase();
  const isServiceIncomplete =
    (booking?.itemType === 'service' || Boolean(booking?.serviceId)) &&
    statusUpper !== 'COMPLETED';

  if (isPaid) {
    return (
      <span className="pay-now-badge paid">
        <MdCheckCircle /> Paid
      </span>
    );
  }

  if (isServiceIncomplete) {
    return (
      <button
        disabled
        className={`pay-now-btn pending-completion ${className}`}
        style={style}
        title="Payment is enabled after technician marks service as completed"
      >
        Pay at Completion
      </button>
    );
  }

  const rawAmount =
    booking?.financialSnapshot?.totalAmountPaise
      ? booking.financialSnapshot.totalAmountPaise / 100
      : booking?.totalAmount || booking?.baseAmount || 0;

  const displayAmount = Number(rawAmount || 0).toFixed(2);

  return (
    <div className="pay-now-container">
      <button
        onClick={handlePay}
        disabled={loading}
        className={`pay-now-btn ${variant} ${className}`}
        style={style}
      >
        {loading ? (
          <>
            <Loader2 className="spinner-icon" size={16} />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <MdPayment />
            <span>Pay ₹{displayAmount}</span>
          </>
        )}
      </button>
      {error && <p className="pay-now-error">{error}</p>}
    </div>
  );
};

export default PayNowButton;
