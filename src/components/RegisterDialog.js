import React, { useState } from 'react';
import './AuthDialog.css';
import { signup, verifyOTP } from '../services/authServices';

const RegisterDialog = ({
  isOpen,
  onClose,
  onRegisterSuccess,
  onNavigateToLogin,
  onShowToast
}) => {
  const [formData, setFormData] = useState({
    identifier: '',
    role: 'Customer',
    termsAndServices: false,
    privacyPolicy: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.identifier)) {
      newErrors.identifier = 'Please enter a valid 10-digit phone number';
    }
    if (!formData.termsAndServices) {
      newErrors.termsAndServices = 'You must accept terms and services';
    }
    if (!formData.privacyPolicy) {
      newErrors.privacyPolicy = 'You must accept privacy policy';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await signup({
        identifier: formData.identifier,
        role: formData.role,
        termsAndServices: formData.termsAndServices,
        privacyPolicy: formData.privacyPolicy
      });

      if (response?.success || response?.message?.toLowerCase().includes('otp')) {
        setOtpSent(true);
        onShowToast?.('OTP sent to your phone number');
      } else {
        const errorMsg = response?.message || response?.error?.message || response?.data?.message || 'Registration failed. Please try again.';
        setErrors({ identifier: errorMsg });
      }
    } catch (error) {
      console.error("Signup error:", error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error?.message || error.message || 'Registration failed. Please try again.';
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
      const response = await verifyOTP({
        identifier: formData.identifier,
        otp: otp
      });

      const resToken = response?.token || response?.result?.token;
      const resUser = response?.user || response?.result?.user || response?.result;

      if (response?.success || resToken) {
        if (resToken) {
          localStorage.setItem('token', resToken);
        }

        const userToSave = resUser && typeof resUser === 'object' ? resUser : {
          identifier: formData.identifier,
          role: formData.role
        };

        localStorage.setItem('currentUser', JSON.stringify(userToSave));
        onRegisterSuccess(userToSave);
        onClose();
        // Reset form
        setFormData({
          identifier: '',
          role: 'Customer',
          termsAndServices: false,
          privacyPolicy: false
        });
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
      await signup({
        identifier: formData.identifier,
        role: formData.role,
        termsAndServices: formData.termsAndServices,
        privacyPolicy: formData.privacyPolicy
      });
      onShowToast?.('OTP resent successfully');
    } catch (error) {
      onShowToast?.('Failed to resend OTP');
    }
  };

  const handleBackToRegister = () => {
    setOtpSent(false);
    setOtp('');
    setOtpError('');
  };

  return (
    <div className="auth-dialog-overlay" onClick={onClose}>
      <div className="auth-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose}>×</button>

        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Register to get started</p>
        </div>

        {!otpSent ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-input-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="identifier"
                placeholder="Enter your phone number"
                value={formData.identifier}
                onChange={handleChange}
                className={errors.identifier ? 'error' : ''}
                maxLength={10}
              />
              {errors.identifier && <span className="error-text">{errors.identifier}</span>}
            </div>

            <div className="auth-input-group checkbox-group">
              <div className="checkbox-row">
                <input
                  type="checkbox"
                  id="termsAndServices"
                  name="termsAndServices"
                  checked={formData.termsAndServices}
                  onChange={handleChange}
                  className="custom-checkbox"
                />
                <label className="checkbox-label-text">
                  I agree to the <span className="legal-link">Terms and Services</span>
                </label>
              </div>
              {errors.termsAndServices && <span className="error-text">{errors.termsAndServices}</span>}
            </div>

            <div className="auth-input-group checkbox-group">
              <div className="checkbox-row">
                <input
                  type="checkbox"
                  id="privacyPolicy"
                  name="privacyPolicy"
                  checked={formData.privacyPolicy}
                  onChange={handleChange}
                  className="custom-checkbox"
                />
                <label className="checkbox-label-text">
                  I agree to the <span className="legal-link">Privacy Policy</span>
                </label>
              </div>
              {errors.privacyPolicy && <span className="error-text">{errors.privacyPolicy}</span>}
            </div>

            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="otp-info">
              <p>Enter the 4-digit OTP sent to</p>
              <p className="otp-phone">+91 {formData.identifier}</p>
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
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="otp-resend">
              <span>Didn't receive the code? </span>
              <button type="button" onClick={handleResendOtp}>Resend OTP</button>
            </div>

            <button type="button" className="back-to-register" onClick={handleBackToRegister}>
              Change phone number
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>Already have an account? <button onClick={onNavigateToLogin}>Login Now</button></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterDialog;

