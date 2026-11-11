import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Coins,
  RotateCw,
  Gift,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  ShieldCheck,
  ArrowLeft,
  Wrench,
  Award,
  Zap,
  HelpCircle
} from 'lucide-react';
import {
  getRewardsBalance,
  getRewardsHistory,
  reconcileRewards
} from '../services/rewardsService';
import './RewardsPage.css';

const RewardsPage = ({ currentUser, onLoginClick, showToast }) => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState({
    availableCoins: 0,
    reservedCoins: 0,
    rupees: 0,
    lifetime: {
      earned: 0,
      redeemed: 0,
      expired: 0,
      reversed: 0
    }
  });

  const [historyItems, setHistoryItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'earn' | 'redeem'
  const [loading, setLoading] = useState(false);
  const [reconciling, setReconciling] = useState(false);

  const fetchWalletData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [balRes, histRes] = await Promise.all([
        getRewardsBalance(),
        getRewardsHistory({ page: 1, limit: 50 })
      ]);

      if (balRes?.success && balRes.result) {
        setBalance(balRes.result);
      }
      if (histRes?.success && histRes.result) {
        setHistoryItems(Array.isArray(histRes.result.items) ? histRes.result.items : []);
        setTotalCount(histRes.result.total || 0);
      }
    } catch (err) {
      console.error('Failed to load rewards wallet:', err);
      if (showToast) showToast('Could not refresh rewards wallet');
    } finally {
      setLoading(false);
    }
  }, [currentUser, showToast]);

  useEffect(() => {
    if (currentUser) {
      fetchWalletData();
    }
  }, [currentUser, fetchWalletData]);

  const handleReconcile = async () => {
    if (reconciling) return;
    setReconciling(true);
    try {
      const res = await reconcileRewards();
      if (res?.success) {
        if (showToast) showToast('Rewards wallet synchronized with ledger');
        await fetchWalletData();
      } else {
        if (showToast) showToast(res?.message || 'Sync completed');
      }
    } catch (err) {
      console.error('Reconciliation error:', err);
      if (showToast) showToast('Failed to sync wallet ledger');
    } finally {
      setReconciling(false);
    }
  };

  const filteredHistory = historyItems.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'earn') return item.type === 'earn';
    if (activeTab === 'redeem') return item.type === 'redeem';
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (!currentUser) {
    return (
      <div className="rewards-page-container">
        <div className="rewards-unauth-card">
          <div className="rewards-unauth-icon-wrap">
            <Coins size={36} />
          </div>
          <h2>RightTouch Rewards Wallet</h2>
          <p>
            Sign in to check your rewards balance, view transaction receipts, and redeem direct discounts on expert home services.
          </p>
          <button className="rewards-unauth-btn" onClick={onLoginClick}>
            Sign In to View Wallet
          </button>
        </div>
      </div>
    );
  }

  const availableCoins = balance?.availableCoins ?? 0;
  const rupeeValue = balance?.rupees ?? availableCoins / 100;
  const lifetimeEarned = balance?.lifetime?.earned ?? 0;
  const lifetimeRedeemed = balance?.lifetime?.redeemed ?? 0;

  return (
    <div className="rewards-page-container">
      {/* Top Header Card */}
      <div className="rewards-header">
        <div className="rewards-header-left">
          <button
            className="rewards-back-btn"
            onClick={() => navigate('/account')}
            aria-label="Back to Account"
            title="Back to Account"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="rewards-title-group">
            <h1>RightTouch Rewards &amp; Wallet</h1>
            <p>Earn coins on every service booking and redeem discounts at checkout</p>
          </div>
        </div>

        <div className="rewards-header-actions">
          <button
            className="rewards-sync-btn"
            onClick={handleReconcile}
            disabled={reconciling || loading}
            title="Synchronize balance with ledger"
          >
            <RotateCw size={15} className={reconciling ? 'spin' : ''} />
            <span>{reconciling ? 'Syncing...' : 'Sync Ledger'}</span>
          </button>

          <button
            className="rewards-book-btn"
            onClick={() => navigate('/services')}
          >
            <Wrench size={15} />
            <span>Book Service</span>
          </button>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="rewards-hero-banner">
        <div className="rewards-hero-pattern-1" />
        <div className="rewards-hero-pattern-2" />
        <div className="rewards-hero-inner">
          <div className="rewards-hero-left">
            <div className="rewards-badge-row">
              <span className="rewards-program-tag">
                <Sparkles size={12} /> RightTouch Loyalty Program
              </span>
              <span className="rewards-ratio-tag">100 Coins = ₹1</span>
            </div>

            <div className="rewards-coin-large">
              <span className="rewards-coin-number">
                {availableCoins.toLocaleString()}
              </span>
              <span className="rewards-coin-unit">Available Coins</span>
            </div>

            <div className="rewards-rupee-equiv">
              <Wallet size={18} /> Equivalent Discount Value:{' '}
              <strong>₹{rupeeValue.toFixed(2)}</strong>
            </div>
          </div>

          <div className="rewards-hero-right">
            <div className="rewards-hero-pill-box">
              <span>Reserved Balance</span>
              <strong>{(balance?.reservedCoins || 0).toLocaleString()} Coins</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="rewards-stats-grid">
        <div className="rewards-stat-card">
          <div className="rewards-stat-header">
            <span className="rewards-stat-label">Available Balance</span>
            <div className="rewards-stat-icon green">
              <Coins size={18} />
            </div>
          </div>
          <div className="rewards-stat-number">{availableCoins.toLocaleString()}</div>
          <div className="rewards-stat-desc">≈ ₹{rupeeValue.toFixed(2)} savings</div>
        </div>

        <div className="rewards-stat-card">
          <div className="rewards-stat-header">
            <span className="rewards-stat-label">Lifetime Earned</span>
            <div className="rewards-stat-icon amber">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="rewards-stat-number">{lifetimeEarned.toLocaleString()}</div>
          <div className="rewards-stat-desc">≈ ₹{(lifetimeEarned / 100).toFixed(2)} total earned</div>
        </div>

        <div className="rewards-stat-card">
          <div className="rewards-stat-header">
            <span className="rewards-stat-label">Total Redeemed</span>
            <div className="rewards-stat-icon blue">
              <Gift size={18} />
            </div>
          </div>
          <div className="rewards-stat-number">{lifetimeRedeemed.toLocaleString()}</div>
          <div className="rewards-stat-desc">≈ ₹{(lifetimeRedeemed / 100).toFixed(2)} used</div>
        </div>

        <div className="rewards-stat-card">
          <div className="rewards-stat-header">
            <span className="rewards-stat-label">Member Tier</span>
            <div className="rewards-stat-icon purple">
              <Award size={18} />
            </div>
          </div>
          <div className="rewards-stat-number">Gold Member</div>
          <div className="rewards-stat-desc">Direct ledger verified</div>
        </div>
      </div>

      {/* Content Layout */}
      <div className="rewards-content-layout">
        {/* Main Column: Activity History */}
        <div className="rewards-main-col">
          <div className="rewards-section-card">
            <div className="rewards-section-header">
              <h3>Reward Activity History ({totalCount})</h3>
              <div className="rewards-tabs-pills">
                <button
                  className={`rewards-pill-btn ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All
                </button>
                <button
                  className={`rewards-pill-btn ${activeTab === 'earn' ? 'active' : ''}`}
                  onClick={() => setActiveTab('earn')}
                >
                  Earned
                </button>
                <button
                  className={`rewards-pill-btn ${activeTab === 'redeem' ? 'active' : ''}`}
                  onClick={() => setActiveTab('redeem')}
                >
                  Redeemed
                </button>
              </div>
            </div>

            <div className="rewards-history-list">
              {loading && historyItems.length === 0 ? (
                <div className="rewards-empty-box">
                  <RotateCw size={28} className="spin" color="#059669" />
                  <h4>Loading Activity...</h4>
                  <p>Fetching your verified rewards history from the ledger</p>
                </div>
              ) : filteredHistory.length > 0 ? (
                filteredHistory.map((item, idx) => {
                  const isEarn = item.type === 'earn';
                  const isRedeem = item.type === 'redeem';
                  return (
                    <div key={item._id || idx} className="rewards-txn-row">
                      <div className="rewards-txn-left-block">
                        <div className={`rewards-txn-symbol ${item.type || 'earn'}`}>
                          {isEarn ? (
                            <ArrowDownLeft size={20} />
                          ) : isRedeem ? (
                            <ArrowUpRight size={20} />
                          ) : (
                            <RotateCw size={18} />
                          )}
                        </div>
                        <div className="rewards-txn-info">
                          <span className="rewards-txn-note">
                            {item.note || (isEarn ? 'Service Booking Completed Reward' : 'Rewards Redeemed')}
                          </span>
                          <span className="rewards-txn-sub">
                            {formatDate(item.createdAt)}
                            {item.bookingId && ` • Booking #${String(item.bookingId).slice(-6)}`}
                          </span>
                        </div>
                      </div>

                      <div className="rewards-txn-right-block">
                        <span className={`rewards-txn-coins ${isEarn ? 'earn' : 'redeem'}`}>
                          {isEarn ? '+' : '-'}{Math.abs(item.coins || 0).toLocaleString()} coins
                        </span>
                        <span className="rewards-txn-after">
                          Balance: {(item.balanceAfterCoins ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rewards-empty-box">
                  <Coins size={36} color="#d97706" />
                  <h4>No Transactions Yet</h4>
                  <p>
                    Book and complete an appliance repair or home service to earn reward coins automatically!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side Column: How it Works & Perks */}
        <div className="rewards-side-col">
          <div className="rewards-how-it-works-card">
            <div className="rewards-how-title">
              <HelpCircle size={18} color="#059669" /> How RightTouch Rewards Work
            </div>

            <div className="rewards-step-list">
              <div className="rewards-step-item">
                <div className="rewards-step-num">1</div>
                <div className="rewards-step-text">
                  <h5>Book Any Home Service</h5>
                  <p>Schedule an appliance repair, cleaning, or electrical service with verified experts.</p>
                </div>
              </div>

              <div className="rewards-step-item">
                <div className="rewards-step-num">2</div>
                <div className="rewards-step-text">
                  <h5>Service Completion &amp; Pay</h5>
                  <p>Once service is marked completed and paid, reward coins are auto-credited instantly.</p>
                </div>
              </div>

              <div className="rewards-step-item">
                <div className="rewards-step-num">3</div>
                <div className="rewards-step-text">
                  <h5>100 Coins = ₹1 Value</h5>
                  <p>Coins can be redeemed as direct bill deductions on your next service bookings.</p>
                </div>
              </div>

              <div className="rewards-step-item">
                <div className="rewards-step-num">4</div>
                <div className="rewards-step-text">
                  <h5>Protected Ledger</h5>
                  <p>All coins are audited against our immutable ledger with 12 months active validity.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rewards-perk-promo-card">
            <h4>
              <Zap size={18} /> Need an Appliance Checkup?
            </h4>
            <p>
              Book any AC, refrigerator, or washing machine repair today and earn guaranteed rewards back on your service total!
            </p>
            <button
              className="rewards-perk-action-btn"
              onClick={() => navigate('/services')}
            >
              Explore Services &amp; Book
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardsPage;
