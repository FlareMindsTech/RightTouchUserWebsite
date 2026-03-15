import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdArrowBack, MdSearch, MdExpandMore, MdExpandLess,
  MdOutlinePhone, MdOutlineEmail,
  MdCheckCircle, MdBook, MdLiveTv
} from 'react-icons/md';
import './HelpSupportPage.css';

const FAQS = [
  {
    category: 'Bookings',
    items: [
      { q: 'How do I book a service?', a: 'Browse services from the Home page, add them to your cart, enter your address, and complete checkout. You will receive a confirmation with your booking ID.' },
      { q: 'Can I reschedule my booking?', a: 'Currently, rescheduling is handled by our support team. Please contact us via chat or phone and we will reschedule free of charge up to 2 hours before the appointment.' },
      { q: 'How do I cancel a booking?', a: 'Open the Bookings page, tap the booking you want to cancel, and use the Cancel option. Cancellations made 2+ hours before the appointment are fully refunded.' },
    ]
  },
  {
    category: 'Payments',
    items: [
      { q: 'What payment methods are accepted?', a: 'We accept UPI, debit/credit cards, net banking, and wallets via Razorpay. All transactions are secure and encrypted.' },
      { q: 'When will I be charged?', a: 'Payment is collected after the service is completed and marked as COMPLETED by the technician.' },
      { q: 'How long does a refund take?', a: 'Refunds are processed within 5–7 business days and credited to your original payment method.' },
    ]
  },
  {
    category: 'Technicians',
    items: [
      { q: 'Are technicians background-verified?', a: 'Yes. Every technician on Right Touch is identity-verified, background-checked, and trained before onboarding.' },
      { q: 'What if the technician does not show up?', a: "If your technician doesn't arrive within 30 minutes of the scheduled time, contact our support team immediately. We will reassign or fully refund you." },
      { q: 'Can I request a specific technician?', a: 'Currently we assign the nearest available verified technician. You can rate any technician after each service, and highly-rated ones will be preferred for future bookings.' },
    ]
  },
  {
    category: 'Account',
    items: [
      { q: 'How do I update my profile?', a: 'Go to Account → Edit Profile. You can update your name, email, and phone number.' },
      { q: 'How do I delete my account?', a: 'Go to Account → scroll to the bottom → tap "Delete Account". This action is permanent and all your data will be erased.' },
      { q: "I forgot my password / can't log in.", a: 'Right Touch uses OTP-based login — no password needed. Enter your mobile number and we will send a one-time code.' },
    ]
  },
];

export default function HelpSupportPage({ showToast }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [openItem, setOpenItem] = useState(null); // "catIdx-itemIdx"
  const supportWhatsApp = 'https://wa.me/918000000000?text=Hi%20Right%20Touch%2C%20I%20need%20help%20with%20my%20booking.';

  const toggleItem = (key) => setOpenItem(prev => prev === key ? null : key);

  const filteredFaqs = FAQS.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      !search || item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="hs-page">
      {/* Header */}
      <div className="hs-header">
        <button className="hs-back-btn" onClick={() => navigate('/account')}>
          <MdArrowBack size={22} />
        </button>
        <div>
          <h1 className="hs-title">Help & Support</h1>
          <p className="hs-subtitle">How can we help you today?</p>
        </div>
      </div>

      {/* Hero */}
      <div className="hs-hero">
        <MdBook size={36} className="hs-hero-icon" />
        <h2>Find Answers Fast</h2>
        <p>Search our knowledge base or reach us directly</p>

        <div className="hs-search-wrap">
          <MdSearch size={18} className="hs-search-icon" />
          <input
            type="text"
            placeholder="Search FAQs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="hs-search"
          />
        </div>
      </div>

      <div className="hs-content">
        {/* Contact Cards */}
        <div className="hs-contact-grid">
          <a href="tel:+918000000000" className="hs-contact-card hs-phone">
            <MdOutlinePhone size={24} />
            <span className="hs-contact-label">Call Us</span>
            <span className="hs-contact-detail">+91 80000 00000</span>
          </a>
          <a href="mailto:support@righttouch.in" className="hs-contact-card hs-email">
            <MdOutlineEmail size={24} />
            <span className="hs-contact-label">Email</span>
            <span className="hs-contact-detail">support@righttouch.in</span>
          </a>
        </div>

        {/* Live Status */}
        <div className="hs-status-bar">
          <MdCheckCircle size={16} className="hs-status-dot" />
          <span>All systems are operational</span>
        </div>

        {/* FAQ */}
        <h3 className="hs-faq-heading">Frequently Asked Questions</h3>

        {filteredFaqs.length === 0 ? (
          <div className="hs-no-results">
            <MdSearch size={40} style={{ color: '#cbd5e1' }} />
            <p>No results for "<strong>{search}</strong>"</p>
          </div>
        ) : (
          filteredFaqs.map((cat, ci) => (
            <div key={ci} className="hs-faq-section">
              <h4 className="hs-faq-cat">{cat.category}</h4>
              {cat.items.map((item, ii) => {
                const key = `${ci}-${ii}`;
                const isOpen = openItem === key;
                return (
                  <div key={ii} className={`hs-faq-item ${isOpen ? 'open' : ''}`}>
                    <button className="hs-faq-q" onClick={() => toggleItem(key)}>
                      <span>{item.q}</span>
                      {isOpen ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
                    </button>
                    {isOpen && <p className="hs-faq-a">{item.a}</p>}
                  </div>
                );
              })}
            </div>
          ))
        )}

        {/* Still need help */}
        <div className="hs-still-help">
          <MdLiveTv size={28} className="hs-still-icon" />
          <h4>Still need help?</h4>
          <p>Our support team is ready to assist you.</p>
          <a href={supportWhatsApp} target="_blank" rel="noreferrer" className="hs-cta-btn">Contact Support</a>
        </div>
      </div>
    </div>
  );
}
