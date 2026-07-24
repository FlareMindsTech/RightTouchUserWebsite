import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, FileText, Calendar, Mail, Globe, ArrowLeft, ArrowRight } from 'lucide-react';
import './LegalPage.css';

const LegalPage = ({ isActive, defaultTab = 'privacy' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Sync tab state with URL prop or default
  useEffect(() => {
    if (isActive) {
      if (location.pathname === '/terms-of-service') {
        setActiveTab('terms');
      } else {
        setActiveTab('privacy');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isActive, location.pathname]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'privacy') {
      navigate('/privacy-policy');
    } else {
      navigate('/terms-of-service');
    }
  };

  return (
    <section className={`page ${isActive ? '' : 'hidden'}`} id="page-legal">
      <div className="legal-header">
        <div className="legal-header-content">
          <h1>Legal Center</h1>
          <p>Read our documentation regarding user agreement, privacy practices, and security.</p>
        </div>
      </div>

      <div className="legal-container">
        {/* Navigation Tabs */}
        <div className="legal-tabs">
          <button 
            className={`legal-tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => handleTabChange('privacy')}
          >
            <Shield size={18} className="tab-icon" />
            <span>Privacy Policy</span>
          </button>
          <button 
            className={`legal-tab-btn ${activeTab === 'terms' ? 'active' : ''}`}
            onClick={() => handleTabChange('terms')}
          >
            <FileText size={18} className="tab-icon" />
            <span>Terms of Service</span>
          </button>
        </div>

        {/* Content Container */}
        <div className="legal-card">
          {activeTab === 'privacy' ? (
            <div className="legal-content-section fade-in">
              <div className="content-meta">
                <div className="meta-item">
                  <Calendar size={16} />
                  <span>Last Updated: June 09, 2026</span>
                </div>
                <div className="meta-item">
                  <Globe size={16} />
                  <span>Applicable for: India</span>
                </div>
              </div>

              <h2>Privacy Policy</h2>
              <p className="lead-text">
                Right Touch is a technology platform that connects customers with trusted service professionals for home and business services, including solar, plumbing, electrical, electronics repair, cleaning, and other maintenance services. We value your privacy and are committed to protecting your personal data.
              </p>

              <hr className="divider" />

              <div className="legal-section">
                <h3>1. Introduction</h3>
                <p>
                  This Privacy Policy describes how Right Touch ("we", "us", or "our") collects, uses, shares, and protects your personal information when you use our website, mobile application, and related services (collectively, the "Platform"). By accessing or using our Platform, you consent to the collection and use of your information as outlined in this policy.
                </p>
              </div>

              <div className="legal-section">
                <h3>2. Information We Collect</h3>
                
                <h4>Account Information</h4>
                <p>We may collect the following information when you create or use your account:</p>
                <ul className="legal-list">
                  <li>Full name</li>
                  <li>Phone number</li>
                  <li>Email address</li>
                  <li>Profile photo (optional)</li>
                  <li>Service address(es)</li>
                  <li>Payment information, where applicable</li>
                </ul>

                <h4>Booking Information</h4>
                <p>To provide our services, we collect:</p>
                <ul className="legal-list">
                  <li>Service requests</li>
                  <li>Booking history</li>
                  <li>Preferred appointment date and time</li>
                  <li>Communication related to your bookings</li>
                </ul>

                <h4>Location Data</h4>
                <p>We collect your location information (with your permission) to:</p>
                <ul className="legal-list">
                  <li>Help you find nearby service professionals.</li>
                  <li>Display accurate service availability.</li>
                  <li>Improve booking accuracy and service delivery.</li>
                </ul>
                <p className="note-text">
                  Location access is used only when necessary and according to your device permissions.
                </p>
              </div>

              <div className="legal-section">
                <h3>3. How We Use Your Information</h3>
                <p>We use your information to:</p>
                <ul className="legal-list">
                  <li>Create and manage your customer account.</li>
                  <li>Process and confirm service bookings.</li>
                  <li>Connect you with nearby service professionals.</li>
                  <li>Send booking confirmations and service updates.</li>
                  <li>Process payments and refunds, where applicable.</li>
                  <li>Improve our services and customer experience.</li>
                  <li>Prevent fraud and maintain platform security.</li>
                </ul>
              </div>

              <div className="legal-section">
                <h3>4. Data Sharing</h3>
                <p>We respect your privacy and do not sell your personal information. We may share limited information with:</p>
                <ul className="legal-list">
                  <li><strong>Service Professionals:</strong> To complete your requested service, such as your name, contact number, service address, and booking details.</li>
                  <li><strong>Payment Providers:</strong> To securely process payments and refunds.</li>
                  <li><strong>Legal Authorities:</strong> When required by applicable law or to protect the safety, rights, or property of our users and the platform.</li>
                </ul>
              </div>

              <div className="legal-section">
                <h3>5. Data Retention & Security</h3>
                <p>We use industry-standard security measures to protect your personal information. Your information is retained only as long as necessary to:</p>
                <ul className="legal-list">
                  <li>Provide our services.</li>
                  <li>Fulfill legal and regulatory obligations.</li>
                  <li>Resolve disputes.</li>
                  <li>Enforce our policies and agreements.</li>
                </ul>
              </div>

              <div className="legal-section">
                <h3>6. Children's Privacy</h3>
                <p>
                  Right Touch is intended for users who are at least 15 years of age. We do not knowingly collect personal information from children. If we become aware that such information has been collected, we will promptly delete it.
                </p>
              </div>

              <div className="legal-section">
                <h3>7. Device Permissions</h3>
                <p>To provide our services, the app may request access to:</p>
                <ul className="legal-list">
                  <li><strong>Location:</strong> To identify nearby service professionals and improve booking accuracy.</li>
                  <li><strong>Camera & Gallery:</strong> To upload profile photos or images related to service requests.</li>
                  <li><strong>Notifications:</strong> To send booking confirmations, technician updates, reminders, offers, and important service notifications.</li>
                </ul>
              </div>

              <div className="legal-section">
                <h3>8. Your Rights</h3>
                <p>You have the right to:</p>
                <ul className="legal-list">
                  <li>Access and update your personal information.</li>
                  <li>Request deletion of your account and associated personal data.</li>
                  <li>Withdraw permissions such as location access through your device settings (this may affect certain app features).</li>
                  <li>Contact us regarding any privacy-related concerns.</li>
                </ul>
              </div>

              <hr className="divider" />

              <div className="contact-box">
                <h4>Contact Us</h4>
                <p>If you have any questions regarding this Privacy Policy, please contact us:</p>
                <div className="contact-details">
                  <div className="contact-line">
                    <Mail size={16} />
                    <a href="mailto:support@righttouchservice.com">support@righttouchservice.com</a>
                  </div>
                  <div className="contact-line">
                    <Globe size={16} />
                    <span>Country: India</span>
                  </div>
                </div>
                <p className="copyright-line">© 2026 Right Touch. All rights reserved.</p>
              </div>
            </div>
          ) : (
            <div className="legal-content-section fade-in">
              <div className="content-meta">
                <div className="meta-item">
                  <Calendar size={16} />
                  <span>Last Updated: June 2026</span>
                </div>
                <div className="meta-item">
                  <Globe size={16} />
                  <span>Applicable for: India</span>
                </div>
              </div>

              <h2>Terms & Conditions</h2>
              <p className="lead-text">
                The Right Touch App is a technology platform that connects customers with independent service professionals for home, business, and maintenance services.
              </p>

              <hr className="divider" />

              <div className="legal-section">
                <h3>1. Platform Nature</h3>
                <p>
                  The Right Touch App is a technology platform that connects customers with independent service professionals for home, business, and maintenance services.
                </p>
                <p>
                  Right Touch does not directly provide any services and does not employ technicians. All services are performed by independent service providers registered on the platform.
                </p>
              </div>

              <div className="legal-section">
                <h3>2. Eligibility</h3>
                <p>To use the Right Touch App, you must:</p>
                <ul className="legal-list">
                  <li>Be at least 15 years of age or have the permission of a parent or legal guardian.</li>
                  <li>Provide accurate and complete registration information.</li>
                  <li>Maintain the confidentiality of your account credentials.</li>
                  <li>Use the platform only for lawful purposes.</li>
                </ul>
              </div>

              <div className="legal-section">
                <h3>3. Customer Account Responsibility</h3>
                <p>You are responsible for:</p>
                <ul className="legal-list">
                  <li>Keeping your login credentials secure.</li>
                  <li>Providing accurate service addresses and contact information.</li>
                  <li>Booking services only for genuine requirements.</li>
                  <li>Updating your account information whenever necessary.</li>
                </ul>
                <p>Any activity performed through your account is your responsibility.</p>
              </div>

              <div className="legal-section">
                <h3>4. Service Booking</h3>
                <p>By booking a service through the Right Touch App, you agree that:</p>
                <ul className="legal-list">
                  <li>Service availability depends on technician availability in your location.</li>
                  <li>Estimated arrival times may vary due to traffic, weather, or other unforeseen circumstances.</li>
                  <li>You will provide safe access to the service location.</li>
                  <li>You may cancel or reschedule bookings according to the platform's cancellation policy.</li>
                </ul>
              </div>

              <div className="legal-section">
                <h3>5. Pricing & Payments</h3>
                <ul className="legal-list">
                  <li>Service charges are displayed before confirmation whenever applicable.</li>
                  <li>Additional charges may apply if extra work or materials are required and are approved by the customer.</li>
                  <li>Payments may be made through supported online payment methods or other approved payment options.</li>
                  <li>Right Touch may collect payments on behalf of service providers where applicable.</li>
                </ul>
              </div>

              <div className="legal-section">
                <h3>6. Customer Responsibilities</h3>
                <p>Customers agree to:</p>
                <ul className="legal-list">
                  <li>Treat service professionals with respect.</li>
                  <li>Provide a safe working environment.</li>
                  <li>Not request illegal or unsafe work.</li>
                  <li>Not misuse or abuse the platform or its services.</li>
                  <li>Make payments as agreed through the platform.</li>
                </ul>
              </div>

              <div className="legal-section">
                <h3>7. Cancellation & Refunds</h3>
                <ul className="legal-list">
                  <li>Customers may cancel bookings before the technician starts travelling or as permitted by the cancellation policy.</li>
                  <li>Cancellation charges may apply in certain situations.</li>
                  <li>Refunds, if applicable, will be processed according to the Right Touch Refund Policy.</li>
                </ul>
              </div>

              <div className="legal-section">
                <h3>8. Ratings & Reviews</h3>
                <p>Customers may rate and review completed services.</p>
                <p>Right Touch reserves the right to remove reviews that contain:</p>
                <ul className="legal-list">
                  <li>Offensive language</li>
                  <li>False information</li>
                  <li>Personal attacks</li>
                  <li>Spam or promotional content</li>
                </ul>
              </div>

              <div className="legal-section">
                <h3>9. Prohibited Activities</h3>
                <p>Users must not:</p>
                <ul className="legal-list">
                  <li>Provide false booking information.</li>
                  <li>Misuse the platform.</li>
                  <li>Harass, threaten, or abuse technicians or support staff.</li>
                  <li>Attempt fraudulent transactions.</li>
                  <li>Circumvent the platform for bookings intended to be completed through Right Touch.</li>
                </ul>
                <p>Violation of these Terms may result in suspension or permanent termination of your account.</p>
              </div>

              <div className="legal-section">
                <h3>10. Limitation of Liability</h3>
                <p>Right Touch acts solely as a technology platform connecting customers with independent service providers.</p>
                <p>Right Touch is not liable for:</p>
                <ul className="legal-list">
                  <li>The quality, suitability, or outcome of services performed by independent technicians.</li>
                  <li>Delays caused by external circumstances.</li>
                  <li>Property damage or personal injury arising from services provided by independent professionals.</li>
                  <li>Disputes between customers and service providers.</li>
                </ul>
                <p>Where permitted by law, Right Touch's liability shall be limited to the amount paid for the relevant booking.</p>
              </div>

              <div className="legal-section">
                <h3>11. Privacy</h3>
                <p>Your personal information is collected and processed in accordance with the Right Touch Privacy Policy.</p>
                <p>By using the app, you consent to such collection and use of your information.</p>
              </div>

              <div className="legal-section">
                <h3>12. Changes to Terms</h3>
                <p>Right Touch reserves the right to update these Terms & Conditions at any time.</p>
                <p>Continued use of the application after changes become effective constitutes acceptance of the revised Terms.</p>
              </div>

              <div className="legal-section">
                <h3>13. Governing Law</h3>
                <p>These Terms & Conditions shall be governed by and interpreted in accordance with the laws of India.</p>
                <p>Any disputes shall be subject to the jurisdiction of the competent courts in India.</p>
              </div>

              <hr className="divider" />

              <div className="contact-box">
                <h4>Contact Us</h4>
                <p>If you have any questions regarding these Terms & Conditions, please contact us:</p>
                <div className="contact-details">
                  <div className="contact-line">
                    <Mail size={16} />
                    <a href="mailto:support@righttouchservice.com">support@righttouchservice.com</a>
                  </div>
                  <div className="contact-line">
                    <Globe size={16} />
                    <span>Country: India</span>
                  </div>
                </div>
                <p className="copyright-line">© 2026 Right Touch. All rights reserved.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default LegalPage;
