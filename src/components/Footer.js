import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, Linkedin } from 'lucide-react';
import logo from '../assets/logo.png';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-main">
                <div className="footer-container">
                    <div className="footer-grid">
                        {/* Branding Column */}
                        <div className="footer-col branding-col">
                            <Link to="/" className="footer-brand">
                                <img src={logo} alt="RightTouch" />
                                <span>Right<span className="accent">Touch</span></span>
                            </Link>
                            <p className="brand-pitch">
                                India's most trusted destination for professional home repairs, cleaning, and maintenance services. Expert solutions at your doorstep.
                            </p>
                            <div className="social-icons">
                                <a href="#" aria-label="Facebook"><Facebook size={18} /></a>
                                <a href="#" aria-label="Instagram"><Instagram size={18} /></a>
                                <a href="#" aria-label="Twitter"><Twitter size={18} /></a>
                                <a href="#" aria-label="Linkedin"><Linkedin size={18} /></a>
                            </div>
                        </div>

                        {/* Services Column */}
                        <div className="footer-col">
                            <h4>Our Services</h4>
                            <ul>
                                <li><Link to="/services/ac-repair">AC Repair & Service</Link></li>
                                <li><Link to="/services/plumbing">Plumbing Solutions</Link></li>
                                <li><Link to="/services/electrical">Electrical Services</Link></li>
                                <li><Link to="/services/cleaning">Home Cleaning</Link></li>
                                <li><Link to="/services">View All Services</Link></li>
                            </ul>
                        </div>

                        {/* Quick Links Column */}
                        <div className="footer-col">
                            <h4>Quick Links</h4>
                            <ul>
                                <li><Link to="/about">About RightTouch</Link></li>
                                <li><Link to="/contact">Contact Support</Link></li>
                                <li><Link to="/bookings">Track Bookings</Link></li>
                                <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                                <li><Link to="/terms">Terms & Conditions</Link></li>
                            </ul>
                        </div>

                        {/* Contact Column */}
                        <div className="footer-col contact-col">
                            <h4>Get in Touch</h4>
                            <div className="contact-item">
                                <Phone size={18} className="icon" />
                                <div className="text">
                                    <p className="label">Call us at</p>
                                    <p className="value">+91 98765 43210</p>
                                </div>
                            </div>
                            <div className="contact-item">
                                <Mail size={18} className="icon" />
                                <div className="text">
                                    <p className="label">Email us at</p>
                                    <p className="value">support@righttouch.com</p>
                                </div>
                            </div>
                            <div className="contact-item">
                                <MapPin size={18} className="icon" />
                                <div className="text">
                                    <p className="label">Our HQ</p>
                                    <p className="value">FlareMinds Tech, High-Tech City, India</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="footer-container">
                    <div className="bottom-content">
                        <p className="copyright">&copy; {new Date().getFullYear()} RightTouch Services. All rights reserved.</p>
                        <div className="trust-badges">
                            <span>Secure Payments</span>
                            <span className="dot">•</span>
                            <span>100% Satisfaction</span>
                            <span className="dot">•</span>
                            <span>Verified Pros</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
