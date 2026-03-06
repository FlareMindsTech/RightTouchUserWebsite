import React, { useState } from 'react';
import { FaFacebook, FaGoogle, FaApple } from 'react-icons/fa';
import './AuthDialog.css';

const RegisterDialog = ({ 
  isOpen, 
  onClose, 
  onRegisterSuccess, 
  onNavigateToLogin 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Customer',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      
      // Check if email already exists
      if (users.find(u => u.email === formData.email)) {
        setErrors({ email: 'Email already registered' });
        setIsLoading(false);
        return;
      }

      const newUser = {
        id: Date.now(),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        password: formData.password
      };
      
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      
      onRegisterSuccess(newUser);
      onClose();
      setIsLoading(false);
    }, 1000);
  };

  const handleSocialLogin = (provider) => {
    const mockUser = {
      name: 'Social User',
      email: `user@${provider}.com`,
      role: 'Customer'
    };
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    onRegisterSuccess(mockUser);
    onClose();
  };

  return (
    <div className="auth-dialog-overlay" onClick={onClose}>
      <div className="auth-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose}>×</button>
        
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Register to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="auth-input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="auth-input-group">
            <label>Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={errors.role ? 'error' : ''}
            >
              <option value="Customer">Customer</option>
              <option value="Technician">Technician</option>
              <option value="Admin">Admin</option>
            </select>
            {errors.role && <span className="error-text">{errors.role}</span>}
          </div>

          <div className="auth-input-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <div className="auth-input-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'error' : ''}
            />
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="auth-submit-btn" disabled={isLoading}>
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="auth-divider">
          <span>Or Register with</span>
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
          <p>Already have an account? <button onClick={onNavigateToLogin}>Login Now</button></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterDialog;

