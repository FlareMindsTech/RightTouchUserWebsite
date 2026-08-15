import React, { useState, useRef } from 'react';
import './AuthDialog.css';
import { loginCustomer, verifyLoginOTP } from '../services/authServices';

const AuthDialog = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onNavigateToRegister,
  onShowToast
}) => {
  const [identifier, setIdentifier] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpBoxes, setOtpBoxes] = useState(['', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);
  const formRef = useRef(null);

  React.useEffect(() => {
    let interval;
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, resendTimer]);

  if (!isOpen) return null;

  const otp = otpBoxes.join('');

  const validatePhone = () => {
    const newErrors = {};
    if (!identifier.trim()) {
      newErrors.identifier = 'Phone number is required';
    } else if (!/^\d{10}$/.test(identifier)) {
      newErrors.identifier = 'Please enter a valid 10-digit phone number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePhone()) return;

    setIsLoading(true);
    try {
      const response = await loginCustomer({ identifier });

      if (response?.success || response?.message?.toLowerCase().includes('otp')) {
        setOtpSent(true);
        setResendTimer(180); // 3 minutes
        onShowToast?.('OTP sent to your phone number');
      } else {
        const errorMsg = response?.message || response?.error?.message || response?.data?.message || 'Login failed. Please try again.';
        setErrors({ identifier: errorMsg });
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error?.message || error.message || 'Login failed. Please try again.';
      setErrors({ identifier: errorMsg });
    }
    setIsLoading(false);
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtpBoxes((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    setOtpError('');

    if (digit && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }

    const nextOtp = [...otpBoxes];
    nextOtp[index] = digit;
    if (digit && nextOtp.every((d) => d !== '')) {
      setTimeout(() => formRef.current?.requestSubmit?.(), 200);
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otpBoxes[index] && index > 0) {
      e.preventDefault();
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4).split('');
    const next = ['', '', '', ''];
    digits.forEach((d, i) => { next[i] = d; });
    setOtpBoxes(next);
    setOtpError('');
    otpRefs.current[Math.min(digits.length, 3)]?.focus();
    if (digits.length === 4) {
      setTimeout(() => formRef.current?.requestSubmit?.(), 200);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 4) {
      setOtpError('Please enter a valid 4-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyLoginOTP({
        identifier: identifier,
        otp: otp
      });

      const resToken = response?.token || response?.result?.token;
      const resUser = response?.user || response?.result?.user || response?.result;

      if (response?.success || resToken) {
        if (resToken) {
          localStorage.setItem('token', resToken);
        }

        const userToSave = {
          _id: resUser?._id || resUser?.userId || response?.userId || response?.result?.userId,
          fname: resUser?.fname || '',
          lname: resUser?.lname || '',
          name: resUser?.name || (resUser?.fname ? `${resUser.fname} ${resUser.lname || ''}`.trim() : ''),
          mobileNumber: resUser?.mobileNumber || resUser?.identifier || identifier,
          identifier: resUser?.identifier || resUser?.mobileNumber || identifier,
          role: resUser?.role || 'Customer',
          profileComplete: resUser?.profileComplete || false,
          token: resToken || ''
        };

        localStorage.setItem('currentUser', JSON.stringify(userToSave));
        onLoginSuccess(userToSave);
        onClose();
        // Reset form
        setIdentifier('');
        setOtpSent(false);
        setOtpBoxes(['', '', '', '']);
      } else {
        setOtpError('Invalid OTP. Please try again.');
      }
    } catch (error) {
      setOtpError('OTP verification failed. Please try again.');
    }
    setIsLoading(false);
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    try {
      await loginCustomer({ identifier });
      setResendTimer(180); // Restart 3 min timer
      onShowToast?.('OTP resent successfully');
    } catch (error) {
      onShowToast?.('Failed to resend OTP');
    }
  };

  const handleBackToLogin = () => {
    setOtpSent(false);
    setOtpBoxes(['', '', '', '']);
    setOtpError('');
  };

  return (
    <div className="auth-dialog-overlay" onClick={onClose}>
      <div className="auth-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose}>×</button>

        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Login to continue</p>
        </div>

        {!otpSent ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-input-group">
              <label>Phone Number</label>
              <div className={`phone-input-wrapper ${errors.identifier ? 'error' : ''}`}>
                <span className="phone-prefix">+91</span>
                <span className="phone-prefix-sep"></span>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={identifier}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 10) {
                      setIdentifier(value);
                      setErrors({});
                    }
                  }}
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={10}
                  autoFocus
                />
              </div>
              {errors.identifier && <span className="error-text">{errors.identifier}</span>}
            </div>

            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form ref={formRef} onSubmit={handleVerifyOtp} className="auth-form">
            <div className="otp-info">
              <p>Enter the 4-digit OTP sent to</p>
              <p className="otp-phone">+91 {identifier}</p>
            </div>

            <div className="auth-input-group">
              <label>Enter OTP</label>
              <div className={`otp-boxes ${otpError ? 'error' : ''}`}>
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="tel"
                    className={`otp-box ${otpBoxes[i] ? 'filled' : ''}`}
                    value={otpBoxes[i]}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(e, i)}
                    onPaste={handleOtpPaste}
                    onFocus={(e) => e.target.select()}
                    inputMode="numeric"
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    maxLength={1}
                    autoFocus={i === 0}
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>
              {otpError && <span className="error-text">{otpError}</span>}
            </div>

            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Login'}
            </button>

            <div className="otp-resend">
              <span>Didn't receive the code? </span>
              {resendTimer > 0 ? (
                <span className="resend-wait">Resend in {Math.floor(resendTimer / 60)}:{(resendTimer % 60).toString().padStart(2, '0')}</span>
              ) : (
                <button type="button" onClick={handleResendOtp}>Resend OTP</button>
              )}
            </div>

            <button type="button" className="back-to-register" onClick={handleBackToLogin}>
              Change phone number
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>Don't have an account? <button onClick={onNavigateToRegister}>Register Now</button></p>
        </div>
      </div>
    </div>
  );
};

export default AuthDialog;

