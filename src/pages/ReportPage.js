import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdArrowBack, MdFlag, MdOutlineErrorOutline,
  MdElectricBolt, MdHandshake, MdBugReport, MdOutlineOtherHouses,
  MdCheckCircle
} from 'react-icons/md';
import { createReport } from '../services/reportService';
import { rtAlert } from '../components/RtAlert';
import './ReportPage.css';

const CATEGORIES = [
  { id: 'technician', icon: <MdHandshake size={22} />, label: 'Technician Behavior' },
  { id: 'quality', icon: <MdOutlineErrorOutline size={22} />, label: 'Service Quality' },
  { id: 'safety', icon: <MdElectricBolt size={22} />, label: 'Safety Concern' },
  { id: 'app', icon: <MdBugReport size={22} />, label: 'App / Technical Bug' },
  { id: 'other', icon: <MdOutlineOtherHouses size={22} />, label: 'Other' },
];

export default function ReportPage({ showToast }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = pick category, 2 = details, 3 = done
  const [category, setCategory] = useState('');
  const [form, setForm] = useState({ subject: '', description: '', bookingRef: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) { rtAlert('Please describe the issue', 'warning'); return; }
    setLoading(true);
    try {
      const payload = { category, ...form };
      const res = await createReport(payload);
      if (res?.success || res?.result || res?._id) {
        setStep(3);
      } else {
        rtAlert(res?.message || 'Failed to submit report', 'error');
      }
    } catch {
      rtAlert('Error submitting report', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rep-page">
      {/* Header */}
      <div className="rep-header">
        <button className="rep-back-btn" onClick={() => navigate('/account')}>
          <MdArrowBack size={22} />
        </button>
        <div>
          <h1 className="rep-title">Report an Issue</h1>
          <p className="rep-subtitle">We take every report seriously</p>
        </div>
      </div>

      <div className="rep-content">
        {/* Step 1 – Category */}
        {step === 1 && (
          <div className="rep-step-card animate-in">
            <div className="rep-flag-icon"><MdFlag size={40} /></div>
            <h2 className="rep-step-title">What would you like to report?</h2>
            <p className="rep-step-desc">Choose the category that best describes your issue</p>
            <div className="rep-categories">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  className={`rep-cat-btn ${category === c.id ? 'selected' : ''}`}
                  onClick={() => { setCategory(c.id); setStep(2); }}
                >
                  <span className="rep-cat-icon">{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 – Details */}
        {step === 2 && (
          <div className="rep-step-card animate-in">
            <div className="rep-step-top">
              <button className="rep-step-back" onClick={() => setStep(1)}>← Back</button>
              <div className="rep-chosen-cat">
                {CATEGORIES.find(c => c.id === category)?.icon}
                <span>{CATEGORIES.find(c => c.id === category)?.label}</span>
              </div>
            </div>
            <h2 className="rep-step-title">Tell us what happened</h2>

            <form onSubmit={handleSubmit} className="rep-form">
              <div className="rep-field">
                <label>Subject</label>
                <input
                  type="text"
                  placeholder="Brief summary of the issue"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  maxLength={100}
                />
              </div>
              <div className="rep-field">
                <label>Description <span className="req">*</span></label>
                <textarea
                  placeholder="Describe the issue in detail…"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={5}
                  required
                />
              </div>
              <div className="rep-field">
                <label>Booking ID (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. BK12345"
                  value={form.bookingRef}
                  onChange={e => setForm(f => ({ ...f, bookingRef: e.target.value }))}
                />
              </div>
              <button type="submit" className="rep-submit-btn" disabled={loading}>
                {loading ? 'Submitting…' : 'Submit Report'}
              </button>
            </form>
          </div>
        )}

        {/* Step 3 – Success */}
        {step === 3 && (
          <div className="rep-step-card rep-success animate-in">
            <MdCheckCircle size={64} className="rep-success-icon" />
            <h2 className="rep-step-title">Report Submitted</h2>
            <p className="rep-step-desc">
              Thank you for letting us know. Our team will review your report within 24–48 hours.
            </p>
            <button className="rep-submit-btn" onClick={() => navigate('/account')}>
              Back to Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
