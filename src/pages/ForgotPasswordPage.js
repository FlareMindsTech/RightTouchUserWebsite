import React, { useState } from 'react';
import { FaCheck, FaArrowLeft } from 'react-icons/fa';
import './ForgotPasswordPage.css';

const ForgotPasswordPage = ({ onBackToLogin }) => {
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password, 4: success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setErrors({ email: 'Email is required' });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Please enter a valid email' });
      return;
    }
    // Simulate sending OTP
    setTimeout(() => {
      setStep(2);
      setErrors({});
    }, 1000);
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 4) {
      setErrors({ otp: 'Please enter a valid 4-digit OTP' });
      return;
    }
    // Simulate OTP verification
    setTimeout(() => {
      setStep(3);
      setErrors({});
    }, 1000);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Update password in localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.email === email);
    
    if (userIndex !== -1) {
      users[userIndex].password = newPassword;
      localStorage.setItem('users', JSON.stringify(users));
    }

    setShowSuccess(true);
    setTimeout(() => {
      setStep(4);
    }, 1500);
  };

  const handleBackToLogin = () => {
    setStep(1);
    setEmail('');
    setOtp(['', '', '', '']);
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    if (onBackToLogin) onBackToLogin();
  };

  const isDesktop = window.innerWidth >= 768;

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        {step === 1 && (
          <div className="fp-section">
            <h1 className="fp-title">Forgot Password?</h1>
            <p className="fp-description">
              Don't worry! It occurs. Please enter the email address linked with your account.
            </p>

            <form onSubmit={handleEmailSubmit} className="fp-form">
              <div className="fp-input-group">
                <label>Enter your email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <button type="submit" className="fp-submit-btn">
                Send Code
              </button>
            </form>

            <div className="fp-footer">
              <button className="fp-back-link" onClick={handleBackToLogin}>
                <FaArrowLeft /> Remember password? Login
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fp-section">
            <h1 className="fp-title">OTP Verification</h1>
            <p className="fp-description">
              Enter the verification code we just sent on your email address.
            </p>

            <form onSubmit={handleOtpSubmit} className="fp-form">
              <div className="otp-inputs">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-input-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="otp-digit"
                  />
                ))}
              </div>
              {errors.otp && <span className="error-text">{errors.otp}</span>}

              <button type="submit" className="fp-submit-btn">
                Verify
              </button>
            </form>

            <div className="fp-footer">
              <p className="fp-resend">
                Didn't receive the code? <button>Resend</button>
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fp-section">
            <h1 className="fp-title">Create New Password</h1>
            <p className="fp-description">
              Your new password must be unique from those previously used.
            </p>

            <form onSubmit={handlePasswordSubmit} className="fp-form">
              <div className="fp-input-group">
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="Create new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={errors.newPassword ? 'error' : ''}
                />
                {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
              </div>

              <div className="fp-input-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={errors.confirmPassword ? 'error' : ''}
                />
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>

              <button type="submit" className="fp-submit-btn">
                Reset Password
              </button>
            </form>
          </div>
        )}

        {step === 4 && (
          <div className="fp-section fp-success">
            <div className="success-icon">
              <FaCheck />
            </div>
            <h1 className="fp-title">Password Changed</h1>
            <p className="fp-description">
              Your password has been successfully reset.
            </p>

            <button className="fp-submit-btn" onClick={handleBackToLogin}>
              Back to Login
            </button>
          </div>
        )}
      </div>

      {showSuccess && (
        <div className="fp-toast">
          <FaCheck className="toast-icon" />
          <span>Password changed successfully!</span>
        </div>
      )}
    </div>
  );
};

export default ForgotPasswordPage;

