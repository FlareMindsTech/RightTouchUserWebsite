import React, { useState } from 'react';
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
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  if (!isOpen) return null;

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

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setOtp(value);
      setOtpError('');
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
        setOtp('');
      } else {
        setOtpError('Invalid OTP. Please try again.');
      }
    } catch (error) {
      setOtpError('OTP verification failed. Please try again.');
    }
    setIsLoading(false);
  };

  const handleResendOtp = async () => {
    try {
      await loginCustomer({ identifier });
      onShowToast?.('OTP resent successfully');
    } catch (error) {
      onShowToast?.('Failed to resend OTP');
    }
  };

  const handleBackToLogin = () => {
    setOtpSent(false);
    setOtp('');
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
              <input
                type="tel"
                placeholder="Enter your phone number"
                value={identifier}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 10) {
                    setIdentifier(value);
                    setErrors({});
                  }
                }}
                className={errors.identifier ? 'error' : ''}
                maxLength={10}
              />
              {errors.identifier && <span className="error-text">{errors.identifier}</span>}
            </div>

            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="otp-info">
              <p>Enter the 4-digit OTP sent to</p>
              <p className="otp-phone">+91 {identifier}</p>
            </div>

            <div className="auth-input-group">
              <label>Enter OTP</label>
              <input
                type="text"
                placeholder="Enter 4-digit OTP"
                value={otp}
                onChange={handleOtpChange}
                className={otpError ? 'error' : ''}
                maxLength={4}
              />
              {otpError && <span className="error-text">{otpError}</span>}
            </div>

            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Login'}
            </button>

            <div className="otp-resend">
              <span>Didn't receive the code? </span>
              <button type="button" onClick={handleResendOtp}>Resend OTP</button>
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

