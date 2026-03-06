import React, { useState } from 'react';
import { FaFacebook, FaGoogle, FaApple } from 'react-icons/fa';
import './AuthDialog.css';

const AuthDialog = ({ 
  isOpen, 
  onClose, 
  onLoginSuccess, 
  onNavigateToRegister, 
  onNavigateToForgotPassword 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.email === email && u.password === password);
      
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        onLoginSuccess(user);
        onClose();
      } else {
        setErrors({ password: 'Invalid email or password' });
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleSocialLogin = (provider) => {
    // Simulate social login
    const mockUser = {
      name: 'Social User',
      email: `user@${provider}.com`,
      role: 'Customer'
    };
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    onLoginSuccess(mockUser);
    onClose();
  };

  return (
    <div className="auth-dialog-overlay" onClick={onClose}>
      <div className="auth-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose}>×</button>
        
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Login to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="auth-input-group">
            <div className="label-row">
              <label>Password</label>
              <button 
                type="button" 
                className="forgot-password-link"
                onClick={() => {
                  onClose();
                  onNavigateToForgotPassword();
                }}
              >
                Forgot Password?
              </button>
            </div>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <button type="submit" className="auth-submit-btn" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-divider">
          <span>Or login with</span>
        </div>

        <div className="social-buttons">
          <button className="social-btn facebook" onClick={() => handleSocialLogin('facebook')}>
            <FaFacebook />
          </button>
          <button className="social-btn google" onClick={() => handleSocialLogin('google')}>
            <FaGoogle />
          </button>
          <button className="social-btn apple" onClick={() => handleSocialLogin('apple')}>
            <FaApple />
          </button>
        </div>

        <div className="auth-footer">
          <p>Don't have an account? <button onClick={onNavigateToRegister}>Register Now</button></p>
        </div>
      </div>
    </div>
  );
};

export default AuthDialog;

