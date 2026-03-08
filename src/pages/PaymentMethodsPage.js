import React, { useState } from 'react';
import {
    MdOutlineChevronRight,
    MdAdd,
    MdCreditCard,
    MdOutlineAccountBalanceWallet,
    MdMoreVert,
    MdDeleteOutline
} from 'react-icons/md';
import { SiVisa, SiMastercard, SiPhonepe, SiPaytm } from 'react-icons/si';
import { useNavigate } from 'react-router-dom';
import './PaymentMethodsPage.css';

const PaymentMethodsPage = ({ isActive, showToast }) => {
    const navigate = useNavigate();
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Start with empty arrays so no fake UI data is shown.
    const [savedCards, setSavedCards] = useState([]);
    const [upiIds, setUpiIds] = useState([]);

    const getCardIcon = (brand) => {
        switch (brand.toLowerCase()) {
            case 'visa': return <SiVisa className="brand-icon visa" />;
            case 'mastercard': return <SiMastercard className="brand-icon mastercard" />;
            default: return <MdCreditCard className="brand-icon default" />;
        }
    };

    const getUpiIcon = (app) => {
        switch (app.toLowerCase()) {
            case 'phonepe': return <SiPhonepe className="brand-icon phonepe" />;
            case 'paytm': return <SiPaytm className="brand-icon paytm" />;
            default: return <MdOutlineAccountBalanceWallet className="brand-icon default-upi" />;
        }
    };

    const handleBack = () => {
        navigate('/account');
    };

    const handleDeleteCard = (id) => {
        setSavedCards(savedCards.filter(card => card.id !== id));
        setActiveDropdown(null);
        showToast('Card deleted securely');
    };

    const handleDeleteUpi = (id) => {
        setUpiIds(upiIds.filter(upi => upi.id !== id));
        showToast('UPI ID removed');
    };

    if (!isActive) return null;

    return (
        <section className="payment-methods-page">
            <div className="payment-header">
                <button className="back-btn" onClick={handleBack}>
                    <MdOutlineChevronRight className="back-icon" />
                </button>
                <h2 className="payment-title">Manage Payment Methods</h2>
            </div>

            <div className="payment-content">

                {/* Saved Cards Section */}
                <div className="payment-section">
                    <div className="section-header">
                        <h3>Saved Cards</h3>
                        <button className="add-new-btn">
                            <MdAdd /> Add New
                        </button>
                    </div>

                    <div className="cards-list">
                        {savedCards.length === 0 ? (
                            <p style={{ color: '#64748b', fontSize: '0.9rem', padding: '16px 0' }}>No saved cards found.</p>
                        ) : (
                            savedCards.map(card => (
                                <div key={card.id} className="payment-card">
                                    <div className="card-left">
                                        <div className="card-icon-wrapper">
                                            {getCardIcon(card.brand)}
                                        </div>
                                        <div className="card-info">
                                            <p className="card-bank">{card.bank} {card.type}</p>
                                            <p className="card-number">**** **** **** {card.last4}</p>
                                            {card.isDefault && <span className="default-badge">Primary</span>}
                                        </div>
                                    </div>

                                    <div className="card-right">
                                        <button
                                            className="menu-dots"
                                            onClick={() => setActiveDropdown(activeDropdown === `card-${card.id}` ? null : `card-${card.id}`)}
                                        >
                                            <MdMoreVert />
                                        </button>

                                        {activeDropdown === `card-${card.id}` && (
                                            <div className="dropdown-menu">
                                                <button className="dropdown-item delete" onClick={() => handleDeleteCard(card.id)}>
                                                    <MdDeleteOutline className="dropdown-icon" />
                                                    <span>Remove Card</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Saved UPI Section */}
                <div className="payment-section">
                    <div className="section-header">
                        <h3>Linked UPI Accounts</h3>
                        <button className="add-new-btn">
                            <MdAdd /> Add UPI
                        </button>
                    </div>

                    <div className="upi-list">
                        {upiIds.length === 0 ? (
                            <p style={{ color: '#64748b', fontSize: '0.9rem', padding: '16px 0' }}>No linked UPI accounts found.</p>
                        ) : (
                            upiIds.map(upi => (
                                <div key={upi.id} className="payment-card upi-card">
                                    <div className="card-left">
                                        <div className="card-icon-wrapper">
                                            {getUpiIcon(upi.app)}
                                        </div>
                                        <div className="card-info">
                                            <p className="card-bank">{upi.app}</p>
                                            <p className="card-number">{upi.idString}</p>
                                        </div>
                                    </div>

                                    <div className="card-right">
                                        <button className="remove-text-btn" onClick={() => handleDeleteUpi(upi.id)}>
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Razorpay Assurance */}
                <div className="security-assurance">
                    <p>
                        <MdOutlineAccountBalanceWallet className="shield-icon" />
                        100% Secure payments powered by <strong>Razorpay</strong>
                    </p>
                </div>

            </div>
        </section>
    );
};

export default PaymentMethodsPage;
