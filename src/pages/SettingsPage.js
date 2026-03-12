import React, { useState } from 'react'; // Added useState
import { useNavigate } from 'react-router-dom';
import {
  MdArrowBack,
  MdDarkMode,
  MdLightMode,
  MdNotifications,
  MdLanguage,
  MdSecurity,
  MdHelp,
  MdInfo,
  MdChevronRight,
  MdEmail,
  MdDeleteForever
} from 'react-icons/md';
import { deleteMyAccount } from '../services/userService';

const SettingsPage = ({ isActive, isDarkMode, onToggleDarkMode, showToast }) => {
  const navigate = useNavigate();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteFinal, setShowDeleteFinal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleBack = () => {
    navigate('/account');
  };

  const handleToggleDarkMode = () => {
    if (onToggleDarkMode) {
      onToggleDarkMode();
      showToast(isDarkMode ? 'Light mode enabled' : 'Dark mode enabled');
    }
  };

  const handleDeleteAccountFirst = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteAccountStep2 = () => {
    setShowDeleteConfirm(false);
    setShowDeleteFinal(true);
  };

  const handleActualDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await deleteMyAccount();
      if (response?.success) {
        showToast('Account deleted successfully');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('userLoggedOut'));
        navigate('/');
      } else {
        showToast(response?.message || 'Failed to delete account');
      }
    } catch (error) {
      showToast('Error deleting account');
    } finally {
      setIsDeleting(false);
      setShowDeleteFinal(false);
    }
  };

  if (!isActive) return null;

  return (
    <section className="page" id="page-settings">
      {/* Header */}
      <div style={{
        padding: '20px',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleBack}
            style={{
              background: 'var(--bg-input)',
              border: 'none',
              borderRadius: '10px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <MdArrowBack size={24} style={{ color: 'var(--text-primary)' }} />
          </button>
          <h1 style={{
            fontSize: '22px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            Settings
          </h1>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Appearance Section */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{
            fontSize: '13px',
            fontWeight: '700',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px',
            paddingLeft: '4px'
          }}>
            Appearance
          </h3>

          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            overflow: 'hidden'
          }}>
            {/* Dark Mode Toggle */}
            <div style={{
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: isDarkMode ? '#1e293b' : '#f0fdf4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isDarkMode ? (
                    <MdDarkMode size={22} style={{ color: '#fbbf24' }} />
                  ) : (
                    <MdLightMode size={22} style={{ color: '#f59e0b' }} />
                  )}
                </div>
                <div>
                  <p style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    margin: 0
                  }}>
                    Dark Mode
                  </p>
                  <p style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    margin: '2px 0 0 0'
                  }}>
                    {isDarkMode ? 'Currently enabled' : 'Currently disabled'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleToggleDarkMode}
                style={{
                  width: '52px',
                  height: '30px',
                  borderRadius: '15px',
                  background: isDarkMode ? 'var(--green)' : '#e5e7eb',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '3px',
                  left: isDarkMode ? '25px' : '3px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{
            fontSize: '13px',
            fontWeight: '700',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px',
            paddingLeft: '4px'
          }}>
            Notifications
          </h3>

          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MdNotifications size={22} style={{ color: '#3b82f6' }} />
                </div>
                <div>
                  <p style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    margin: 0
                  }}>
                    Push Notifications
                  </p>
                  <p style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    margin: '2px 0 0 0'
                  }}>
                    Receive booking updates
                  </p>
                </div>
              </div>

              <button style={{
                width: '52px',
                height: '30px',
                borderRadius: '15px',
                background: 'var(--green)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '3px',
                  left: '25px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </button>
            </div>

            <div style={{
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MdEmail size={22} style={{ color: '#d97706' }} />
                </div>
                <div>
                  <p style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    margin: 0
                  }}>
                    Email Notifications
                  </p>
                  <p style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    margin: '2px 0 0 0'
                  }}>
                    Receive promotional emails
                  </p>
                </div>
              </div>

              <button style={{
                width: '52px',
                height: '30px',
                borderRadius: '15px',
                background: '#e5e7eb',
                border: 'none',
                cursor: 'pointer',
                position: 'relative'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '3px',
                  left: '3px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </button>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{
            fontSize: '13px',
            fontWeight: '700',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px',
            paddingLeft: '4px'
          }}>
            Support
          </h3>

          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              borderBottom: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#f0fdf4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MdHelp size={22} style={{ color: 'var(--green)' }} />
                </div>
                <p style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  Help Center
                </p>
              </div>
              <MdChevronRight size={24} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div style={{
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              borderBottom: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#f5f3ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MdSecurity size={22} style={{ color: '#7c3aed' }} />
                </div>
                <p style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  Privacy Policy
                </p>
              </div>
              <MdChevronRight size={24} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div style={{
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#fff7ed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MdInfo size={22} style={{ color: '#ea580c' }} />
                </div>
                <p style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  About Us
                </p>
              </div>
              <MdChevronRight size={24} style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{
            fontSize: '13px',
            fontWeight: '700',
            color: '#ef4444',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px',
            paddingLeft: '4px'
          }}>
            Danger Zone
          </h3>

          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid #fecdd3',
            overflow: 'hidden'
          }}>
            <button
              onClick={handleDeleteAccountFirst}
              style={{
                width: '100%',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fff1f2',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#ffe4e6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MdDeleteForever size={22} style={{ color: '#e11d48' }} />
                </div>
                <div>
                  <p style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#e11d48',
                    margin: 0
                  }}>
                    Delete My Account
                  </p>
                  <p style={{
                    fontSize: '12px',
                    color: '#f43f5e',
                    margin: '2px 0 0 0'
                  }}>
                    This action is permanent
                  </p>
                </div>
              </div>
              <MdChevronRight size={24} style={{ color: '#fca5a5' }} />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Overlays */}
        {showDeleteConfirm && (
          <div className="modal-backdrop" style={{ zIndex: 3000 }}>
            <div style={{
              background: 'white',
              width: '90%',
              maxWidth: '400px',
              padding: '32px',
              borderRadius: '24px',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: '#fff1f2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <MdDeleteForever size={32} style={{ color: '#e11d48' }} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>Delete Account?</h2>
              <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.5, marginBottom: '24px' }}>
                Are you sure you want to delete your account? All your data will be permanently removed.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={handleDeleteAccountStep2}
                  style={{
                    padding: '14px',
                    background: '#e11d48',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Yes, Continue
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    padding: '14px',
                    background: '#f1f5f9',
                    color: '#64748b',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteFinal && (
          <div className="modal-backdrop" style={{ zIndex: 3001 }}>
            <div style={{
              background: 'white',
              width: '90%',
              maxWidth: '400px',
              padding: '32px',
              borderRadius: '24px',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#e11d48', marginBottom: '12px' }}>Final Confirmation</h2>
              <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.5, marginBottom: '24px' }}>
                To proceed, please confirm one last time. This action <strong>cannot be undone</strong>.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={handleActualDelete}
                  disabled={isDeleting}
                  style={{
                    padding: '14px',
                    background: '#1a1a1a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {isDeleting ? 'Deleting...' : 'Permanent Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteFinal(false)}
                  style={{
                    padding: '14px',
                    background: '#f1f5f9',
                    color: '#64748b',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* App Version */}
        <div style={{
          textAlign: 'center',
          padding: '20px'
        }}>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            margin: 0
          }}>
            RightTouch App
          </p>
          <p style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            margin: '4px 0 0 0'
          }}>
            Version 1.0.0
          </p>
        </div>
      </div>
    </section>
  );
};

export default SettingsPage;

