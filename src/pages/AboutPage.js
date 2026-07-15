import React, { useEffect } from 'react';
import { Shield, Target, Users, Zap } from 'lucide-react';
import './AboutPage.css';
import logo from '../assets/logo.png';

const AboutPage = ({ isActive }) => {
  useEffect(() => {
    if (isActive) {
      window.scrollTo(0, 0);
    }
  }, [isActive]);

  return (
    <section className={`page ${isActive ? '' : 'hidden'}`} id="page-about">
      <div className="about-hero">
        <div className="about-hero-content">
          <h1>About <span className="accent">RightTouch</span></h1>
          <p>Elevating home and commercial services with precision, reliability, and trust.</p>
        </div>
      </div>

      <div className="about-container">
        <section className="about-section story-section">
          <div className="story-content">
            <h2>Our Story</h2>
            <p>
              Founded with a simple mission: to take the hassle out of property maintenance. 
              At RightTouch, we realized that finding reliable, skilled technicians was harder 
              than it needed to be. We built a platform that bridges the gap between top-tier 
              professionals and customers who expect nothing but the best.
            </p>
            <p>
              From complex commercial solar installations to urgent residential AC repairs, 
              RightTouch ensures that every job is handled with the utmost professionalism 
              and transparency.
            </p>
          </div>
          <div className="story-image">
            <img src={logo} alt="RightTouch Logo" className="about-logo" />
          </div>
        </section>

        <section className="about-section values-section">
          <h2>Our Core Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <Shield className="value-icon" />
              <h3>Trust & Safety</h3>
              <p>Every technician is rigorously vetted and background-checked for your peace of mind.</p>
            </div>
            <div className="value-card">
              <Zap className="value-icon" />
              <h3>Speed & Efficiency</h3>
              <p>We respect your time. Our systems are optimized to get a pro to your door faster.</p>
            </div>
            <div className="value-card">
              <Target className="value-icon" />
              <h3>Precision Quality</h3>
              <p>We don't cut corners. RightTouch stands for getting it done right the first time.</p>
            </div>
            <div className="value-card">
              <Users className="value-icon" />
              <h3>Customer First</h3>
              <p>Your satisfaction is our ultimate metric. We aren't happy until you are thrilled.</p>
            </div>
          </div>
        </section>


      </div>
    </section>
  );
};

export default AboutPage;
