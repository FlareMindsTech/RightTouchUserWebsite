import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  MdArrowBack,
  MdOutlineChevronRight,
  MdSearch,
  MdShoppingCart,
  MdPayment,
  MdCalendarToday,
  MdHistory,
  MdAssignment,
  MdApps,
  MdCheckCircle,
  MdCancel,
  MdAccessTime,
  MdArchive,
  MdFlashOn,
  MdStar,
  MdRefresh,
  MdHandyman,
  MdContentCopy,
  MdStorefront
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import BookingDetailPage from "./BookingDetailPage";
import { getCustomerBookings, getCompletedServices, getBookings, bookAgain } from "../services/bookingService";
import { getAllProductBookings } from "../services/productBookingService";
import { useRazorpayPayment } from "../hooks/useRazorpayPayment";
import { safeParseDate, goBackSmart, getAuthToken } from "../utils/browserUtils";
import { logger } from "../utils/logger";
import ConfirmModal from "../components/ConfirmModal";
import "./BookingsPage.css";

const BookingsPage = ({ isActive = true, showToast, onBack, cartItemCount = 0, currentUser, onLoginClick }) => {
  const navigate = useNavigate();
  const { initiatePayment, loading: paymentLoading } = useRazorpayPayment();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeTab, setActiveTab] = useState("active"); // "active" or "history"
  const [isLoading, setIsLoading] = useState(false);
  const [bookingsHistory, setBookingsHistory] = useState([]);
  const [activeBookingsList, setActiveBookingsList] = useState([]);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [activeHistoryFilter, setActiveHistoryFilter] = useState("ALL"); // "ALL", "COMPLETED", "CANCELLED", "EXPIRED", "HISTORY"
  const [autoOpenRate, setAutoOpenRate] = useState(false);
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(50);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showRebookConfirm, setShowRebookConfirm] = useState(false);
  const [rebookLoading, setRebookLoading] = useState(false);
  const [bookingToRebook, setBookingToRebook] = useState(null);

  const isLoggedIn = Boolean(currentUser?._id || currentUser?.token || getAuthToken());

  const handleBack = () => {
    if (selectedBooking) {
      setSelectedBooking(null);
    } else if (onBack) {
      onBack();
    } else {
      goBackSmart(navigate, "/account");
    }
  };

  const handleBookingClick = (booking, openRate = false) => {
    setAutoOpenRate(openRate);
    setSelectedBooking(booking);
  };

  const fetchMyBookings = useCallback(async () => {
    if (!isLoggedIn) {
      setActiveBookingsList([]);
      setBookingsHistory([]);
      return;
    }

    try {
      setIsLoading(true);

      const [customerRes, completedRes, productRes] = await Promise.allSettled([
        getCustomerBookings(),
        getCompletedServices(),
        getAllProductBookings()
      ]);

      const extractItems = (settledResult) => {
        if (settledResult.status !== "fulfilled" || !settledResult.value) return [];
        const res = settledResult.value;
        if (Array.isArray(res)) return res;

        const found = [];
        const checkAndAdd = (arr) => {
          if (Array.isArray(arr)) {
            found.push(...arr);
          }
        };

        checkAndAdd(res.result?.bookings);
        checkAndAdd(res.result?.orders);
        checkAndAdd(res.result?.data);
        checkAndAdd(res.result?.items);
        checkAndAdd(res.result?.productBookings);
        checkAndAdd(res.result?.serviceBookings);

        if (Array.isArray(res.result)) {
          checkAndAdd(res.result);
        }

        checkAndAdd(res.data?.bookings);
        checkAndAdd(res.data?.orders);
        checkAndAdd(res.data?.data);
        checkAndAdd(res.data?.items);

        if (Array.isArray(res.data)) {
          checkAndAdd(res.data);
        }

        checkAndAdd(res.bookings);
        checkAndAdd(res.orders);
        checkAndAdd(res.productBookings);
        checkAndAdd(res.serviceBookings);

        if (found.length > 0) return found;

        if (res && typeof res === "object") {
          for (const key of Object.keys(res)) {
            if (Array.isArray(res[key]) && res[key].length > 0 && typeof res[key][0] === "object") {
              return res[key];
            }
          }
        }
        return [];
      };

      const cItems = extractItems(customerRes);
      const compItems = extractItems(completedRes);
      const pItems = extractItems(productRes);

      const rawCombined = [...cItems, ...compItems, ...pItems];

      const active = [];
      const history = [];
      const seenIds = new Set();

      rawCombined.forEach((booking) => {
        if (!booking || typeof booking !== "object") return;
        const id = String(booking._id || booking.id || booking.bookingId || booking.orderId || "");
        if (id && seenIds.has(id)) return;
        if (id) seenIds.add(id);

        const statusUpper = (booking.status || booking.bookingStatus || booking.orderStatus || booking.state || "PENDING").toUpperCase();
        const isHistoryStatus = ["COMPLETED", "CANCELLED", "EXPIRED", "FULFILLED", "DELIVERED", "SERVICE_COMPLETED", "REJECTED", "CLOSED"].includes(statusUpper);

        if (isHistoryStatus) {
          history.push(booking);
        } else {
          active.push(booking);
        }
      });

      const getBookingTimestamp = (booking) => {
        const dt = booking?.updatedAt || booking?.scheduledAt || booking?.bookingDate || booking?.scheduledDate || booking?.createdAt || booking?.orderDate;
        const ts = dt ? safeParseDate(dt).getTime() : 0;
        return Number.isNaN(ts) ? 0 : ts;
      };

      active.sort((a, b) => getBookingTimestamp(b) - getBookingTimestamp(a));
      history.sort((a, b) => getBookingTimestamp(b) - getBookingTimestamp(a));

      setActiveBookingsList(active);
      setBookingsHistory(history);

    } catch (err) {
      console.error("Error fetching bookings:", err);
      if (showToast) showToast("Error fetching bookings", "error");
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, showToast]);

  useEffect(() => {
    if (isActive !== false) {
      fetchMyBookings();
    }
  }, [isActive, currentUser?._id, fetchMyBookings]);

  // Derived filtered history
  const filteredHistory = bookingsHistory.filter(booking => {
    const status = (booking.status || "PENDING").toUpperCase();
    const paymentStatus = (booking?.paymentStatus || "").toUpperCase();

    // Consolidated Filter Logic
    if (activeHistoryFilter !== "ALL") {
      if (activeHistoryFilter === "COMPLETED") {
        if (status !== "COMPLETED") return false;
      } else if (activeHistoryFilter === "HISTORY") {
        if (paymentStatus !== "PAID") return false;
      } else {
        if (status !== activeHistoryFilter) return false;
      }
    }

    // 3. Search Query
    if (historySearchQuery.trim()) {
      const query = historySearchQuery.toLowerCase();
      const serviceName = (
        booking?.productSnapshot?.productName ||
        booking?.productId?.productName ||
        booking?.productId?.name ||
        booking?.serviceId?.serviceName ||
        booking?.itemId?.serviceName ||
        booking?.productName ||
        ""
      ).toLowerCase();
      const bookingId = String(booking._id || "").toLowerCase();
      return serviceName.includes(query) || bookingId.includes(query);
    }

    return true;
  });

  const handleAction = async (actionType, booking) => {
    if (actionType === "rebook") {
      setBookingToRebook(booking);
      setShowRebookConfirm(true);
    }
  };

  const executeRebook = async () => {
    if (!bookingToRebook) return;
    try {
      setRebookLoading(true);
      await bookAgain(bookingToRebook._id);
      showToast("Booking created successfully!", "success");
      setShowRebookConfirm(false);
      setBookingToRebook(null);
      await fetchMyBookings();
      setActiveTab("active");
    } catch (err) {
      showToast(err.message || "Failed to re-book", "error");
    } finally {
      setRebookLoading(false);
    }
  };

  const handlePayNow = (booking) => {
    const bookingId = booking._id || booking.id;
    if (!bookingId) {
      showToast("Booking ID is missing", "error");
      return;
    }

    initiatePayment({
      bookingId,
      customerUser: currentUser,
      onSuccess: async () => {
        showToast("Payment completed successfully!", "success");
        await fetchMyBookings();
        setSelectedBooking(null);
      },
      onFailure: (err) => {
        showToast(err.message || "Payment failed", "error");
      }
    });
  };

  // If a booking is selected, show the detail page
  if (selectedBooking) {
    const status = (selectedBooking.status || "").toUpperCase();
    const isPaid = (selectedBooking.paymentStatus || "").toUpperCase() === "PAID";
    const canPay = status !== "CANCELLED" && status !== "EXPIRED" && !isPaid;

    return (
      <BookingDetailPage
        booking={selectedBooking}
        onBack={handleBack}
        handleAction={handleAction}
        showToast={showToast}
        currentUser={currentUser}
        isPaidBooking={isPaid}
        canShowPayNow={canPay}
        paymentLoading={paymentLoading}
        handlePayButtonClick={() => {
          if (isPaid) {
            setShowInvoice(true);
          } else {
            handlePayNow(selectedBooking);
          }
        }}
        canRate={status === "COMPLETED"}
        showInvoice={showInvoice}
        setShowInvoice={setShowInvoice}
        autoOpenRate={autoOpenRate}
        setAutoOpenRate={setAutoOpenRate}
      />
    );
  }

  const renderBookingCard = (booking) => {
    const serviceName =
      booking?.productSnapshot?.productName ||
      booking?.productId?.productName ||
      booking?.productId?.name ||
      booking?.serviceId?.serviceName ||
      booking?.itemId?.serviceName ||
      booking?.cartId?.items?.[0]?.item?.name ||
      booking?.productName ||
      "Product / Service Order";

    const serviceImage =
      booking?.productSnapshot?.imageUrl ||
      booking?.productId?.productImages?.[0] ||
      booking?.serviceId?.serviceImages?.[0] ||
      booking?.itemId?.serviceImages?.[0] ||
      booking?.cartId?.items?.[0]?.item?.serviceImages?.[0] ||
      null;

    const categoryName =
      booking?.productSnapshot?.productType ||
      booking?.productId?.productType ||
      booking?.serviceId?.categoryId?.category ||
      booking?.itemId?.categoryId?.category ||
      (booking?.productId ? "Product Purchase" : null);

    const status = (booking.status || "PENDING").toUpperCase();
    const paymentStatus = (booking?.paymentStatus || "").toUpperCase();
    const isPaymentPending = status !== "CANCELLED" && status !== "EXPIRED" && paymentStatus !== "PAID";
    const paymentLabel = paymentStatus === "PAID" ? "PAID" : "UNPAID";
    const isInstant = booking.bookingType === "instant" || !booking.scheduledAt;
    const dateLabel = booking.scheduledAt
      ? safeParseDate(booking.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : (booking.createdAt ? safeParseDate(booking.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "No date");

    const getStatusClass = (s) => {
      if (["COMPLETED", "ASSIGNED", "ACCEPTED", "IN PROGRESS", "ACCEPTED_BY_TECH", "ON_THE_WAY", "REACHED", "IN_PROGRESS"].includes(s)) return "status-success";
      if (["CANCELLED", "EXPIRED"].includes(s)) return "status-error";
      return "status-warning";
    };

    const isAlreadyRated = Boolean(
      booking?.isRated ||
      booking?.rated ||
      booking?.ratingId ||
      booking?.hasRated ||
      booking?.ratingGiven ||
      booking?.userRating ||
      booking?.review ||
      (typeof booking?.rating === "number" && booking.rating > 0) ||
      (typeof booking?.rating === "object" && booking.rating !== null && Object.keys(booking.rating).length > 0) ||
      (Array.isArray(booking?.ratings) && booking.ratings.length > 0)
    );

    return (
      <div
        key={booking._id}
        className="booking-card-premium"
        onClick={() => handleBookingClick(booking, false)}
      >
        {/* Image + Title row */}
        <div className="booking-card-header">
          <div className="booking-icon-wrapper" style={{ padding: 0, overflow: "hidden", borderRadius: "14px" }}>
            {serviceImage ? (
              <img
                src={serviceImage}
                alt={serviceName}
                loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <MdShoppingCart className="booking-card-icon" />
            )}
          </div>
          <div className="booking-title-group">
            {categoryName && <p className="booking-category-tag">{categoryName}</p>}
            <h4 className="booking-service-name">{serviceName}</h4>
            <div 
              className="booking-id-badge" 
              onClick={(e) => {
                e.stopPropagation();
                if (booking._id) {
                  navigator.clipboard?.writeText(booking._id);
                  if (showToast) showToast("Booking ID copied to clipboard!", "success");
                }
              }}
              title="Click to copy full Booking ID"
            >
              <span>#{booking._id?.slice(-6).toUpperCase()}</span>
              <MdContentCopy className="copy-icon-mini" />
            </div>
          </div>
          <div className="booking-badges">
            <div className={`status-badge-vibrant ${getStatusClass(status)}`}>
              {status.replace(/_/g, " ")}
            </div>
            {status !== "EXPIRED" && status !== "CANCELLED" && (
              <div className={`payment-status-badge ${paymentStatus === "PAID" ? "paid" : "unpaid"}`}>
                {paymentLabel}
              </div>
            )}
          </div>
        </div>

        {isPaymentPending && (
          <div className="payment-pending-banner">
            <MdPayment style={{ marginRight: "6px", flexShrink: 0 }} />
            Payment Pending – Tap to pay
          </div>
        )}

        <div className="booking-card-body">
          <div className="booking-info-row">
            <span className="info-label">{isInstant ? "Booking Type" : "Scheduled Date"}</span>
            <span className="info-value">
              {isInstant ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                  <MdFlashOn style={{ color: "#eab308", fontSize: "15px" }} /> Instant
                </span>
              ) : dateLabel}
            </span>
          </div>
          <div className="booking-info-row">
            <span className="info-label">Total Amount</span>
            <span className="info-value-price">₹{booking.totalPrice || booking.totalAmount || booking.baseAmount || 0}</span>
          </div>

          {booking.technicianId && (
            <div className="booking-tech-preview">
              <div className="tech-avatar-mini">
                {booking.technicianId.profileImage ? (
                  <img src={booking.technicianId.profileImage} alt="Tech" loading="lazy" />
                ) : (
                  <div className="avatar-placeholder">{booking.technicianId.userId?.fname?.charAt(0) || "T"}</div>
                )}
              </div>
              <div className="tech-info-mini">
                <span className="tech-role">Assigned Expert</span>
                <span className="tech-name">{booking.technicianId.userId?.fname} {booking.technicianId.userId?.lname}</span>
              </div>
            </div>
          )}
        </div>

        <div className="booking-card-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            {status === "COMPLETED" && (
              isAlreadyRated ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "rgba(34, 197, 94, 0.1)",
                    color: "#16a34a",
                    borderRadius: "8px",
                    padding: "4px 10px",
                    fontSize: "11.5px",
                    fontWeight: "700"
                  }}
                >
                  <MdCheckCircle style={{ fontSize: "14px" }} /> Rated
                </span>
              ) : (
                <button
                  className="rate-service-card-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBookingClick(booking, true);
                  }}
                  style={{
                    background: "var(--green, #16a34a)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "6px 14px",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <MdStar style={{ fontSize: "15px" }} /> Rate Service
                </button>
              )
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span className="view-details-text">View Details</span>
            <MdOutlineChevronRight className="arrow-icon-premium" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className={`bookings-page-premium ${isActive ? "" : "hidden"}`}>
      {/* Header Section */}
      <div className="bookings-premium-header">
        <div className="header-top">
          <button className="back-btn-premium" onClick={handleBack} aria-label="Go Back">
            <MdArrowBack className="back-icon-premium" />
          </button>
          <div className="header-title-wrapper">
            <h2 className="page-title-premium">My Bookings</h2>
            <p className="page-subtitle-premium">Track your active services, schedules, and past orders</p>
          </div>
          <button 
            className="refresh-btn-premium" 
            onClick={() => fetchMyBookings()} 
            title="Refresh Bookings"
            disabled={isLoading}
            style={{
              marginLeft: "auto",
              background: "rgba(2, 132, 199, 0.08)",
              border: "1px solid rgba(2, 132, 199, 0.18)",
              color: "#0284c7",
              borderRadius: "12px",
              width: "38px",
              height: "38px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0
            }}
          >
            <MdRefresh style={{ fontSize: "20px" }} />
          </button>
        </div>
      </div>

      {/* Tab Navigation - Fixed Segmented Tabs */}
      <div className="bookings-tabs-premium-fixed">
        <div className="bookings-segmented-tabs">
          <button
            className={`tab-btn-premium ${activeTab === "active" ? "active" : ""}`}
            onClick={() => setActiveTab("active")}
          >
            <MdCalendarToday className="tab-icon" />
            <span>Active & Upcoming</span>
            {activeBookingsList.length > 0 && (
              <span className="tab-count-badge active">{activeBookingsList.length}</span>
            )}
          </button>
          <button
            className={`tab-btn-premium ${activeTab === "history" ? "active" : ""}`}
            onClick={() => { setActiveTab("history"); setVisibleHistoryCount(50); }}
          >
            <MdHistory className="tab-icon" />
            <span>Past Bookings</span>
            {bookingsHistory.length > 0 && (
              <span className="tab-count-badge">{bookingsHistory.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="bookings-container-premium">
        {!isLoggedIn ? (
          <div className="empty-state-premium">
            <div className="empty-icon-wrapper">
              <div className="empty-badge-circle">
                <MdCalendarToday />
              </div>
            </div>
            <h3>Sign in to View Your Bookings</h3>
            <p>Access your scheduled service appointments, real-time technician tracking, order receipts, and warranty details.</p>
            <div className="empty-action-group">
              <button
                className="book-now-btn"
                onClick={() => (onLoginClick ? onLoginClick() : navigate("/account"))}
              >
                Sign In / Register
              </button>
              <button
                className="book-now-btn secondary"
                onClick={() => navigate("/services")}
              >
                Browse Services First
              </button>
            </div>
            <div className="empty-trust-chips" style={{ marginTop: "24px" }}>
              <span className="empty-trust-chip">⚡ 120-Min Doorstep</span>
              <span className="empty-trust-chip">🛡️ 30-Day Guarantee</span>
              <span className="empty-trust-chip">⭐ Verified Pros</span>
            </div>
          </div>
        ) : isLoading ? (
          <div className="loading-state-premium">
            <div className="shimmer-card"></div>
            <div className="shimmer-card"></div>
          </div>
        ) : (
          <div className="bookings-list-premium">
            {activeTab === "active" ? (
              activeBookingsList.length > 0 ? (
                activeBookingsList.map(booking => renderBookingCard(booking))
              ) : (
                <div className="empty-state-premium">
                  <div className="empty-icon-wrapper">
                    <div className="empty-badge-circle">
                      <MdCalendarToday />
                    </div>
                  </div>
                  <h3>No Active Bookings</h3>
                  <p>You have no ongoing service orders or appointments scheduled right now.</p>

                  <div className="empty-action-group">
                    <button className="book-now-btn" onClick={() => navigate("/services")}>
                      <MdHandyman style={{ fontSize: "17px" }} /> Book a Service
                    </button>
                    {bookingsHistory.length > 0 && (
                      <button
                        className="book-now-btn secondary"
                        onClick={() => { setActiveTab("history"); setVisibleHistoryCount(5); }}
                      >
                        <MdHistory style={{ fontSize: "17px" }} /> View Past Orders ({bookingsHistory.length})
                      </button>
                    )}
                  </div>
                </div>
              )
            ) : (
              <>
                <div className="history-filters-premium">
                  <div className="history-search-wrapper">
                    <MdSearch className="search-icon-dim" />
                    <input
                      type="text"
                      placeholder="Search by service or ID..."
                      value={historySearchQuery}
                      onChange={(e) => { setHistorySearchQuery(e.target.value); setVisibleHistoryCount(5); }}
                      className="history-search-input"
                    />
                    {historySearchQuery && (
                      <button 
                        className="search-clear-btn"
                        onClick={() => { setHistorySearchQuery(""); setVisibleHistoryCount(5); }}
                        aria-label="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="status-filter-pills-container">
                    <div className="status-filter-pills">
                      {[
                        { id: "ALL", label: "All Bookings", icon: MdApps, iconColor: "#0284c7" },
                        { id: "COMPLETED", label: "Completed", icon: MdCheckCircle, iconColor: "#16a34a" },
                        { id: "CANCELLED", label: "Cancelled", icon: MdCancel, iconColor: "#dc2626" },
                        { id: "EXPIRED", label: "Expired", icon: MdAccessTime, iconColor: "#d97706" },
                        { id: "HISTORY", label: "History Archive", icon: MdArchive, iconColor: "#7c3aed" }
                      ].map(item => {
                        const IconComp = item.icon;
                        const isPillActive = activeHistoryFilter === item.id;
                        return (
                          <button
                            key={item.id}
                            className={`filter-pill ${isPillActive ? "active" : ""}`}
                            onClick={() => { setActiveHistoryFilter(item.id); setVisibleHistoryCount(50); }}
                          >
                            <IconComp
                              className="pill-icon"
                              style={{
                                fontSize: "16px",
                                flexShrink: 0,
                                color: isPillActive ? "#ffffff" : item.iconColor
                              }}
                            />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {filteredHistory.length > 0 ? (
                  <>
                    {filteredHistory.slice(0, visibleHistoryCount).map(booking => renderBookingCard(booking))}
                    {filteredHistory.length > visibleHistoryCount && (
                      <div style={{ textAlign: "center", margin: "20px 0 40px" }}>
                        <button 
                          className="book-now-btn" 
                          onClick={() => setVisibleHistoryCount(prev => prev + 25)}
                        >
                          See More Bookings
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="empty-state-premium">
                    <div className="empty-icon-wrapper">
                      <div className="empty-badge-circle neutral">
                        <MdHistory />
                      </div>
                    </div>
                    <h3>No Bookings Found</h3>
                    <p>{historySearchQuery || activeHistoryFilter !== "ALL" ? "No past bookings match your search or filter criteria." : "Your completed and past service bookings will appear here."}</p>
                    {(historySearchQuery || activeHistoryFilter !== "ALL") && (
                      <button 
                        className="book-now-btn secondary" 
                        onClick={() => { setHistorySearchQuery(""); setActiveHistoryFilter("ALL"); setVisibleHistoryCount(50); }}
                      >
                        Reset Search & Filters
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showRebookConfirm}
        title="Re-book Service"
        message="Are you sure you want to book this service again with the same details?"
        confirmText="Yes, Book Again"
        cancelText="Cancel"
        onConfirm={executeRebook}
        onCancel={() => {
          setShowRebookConfirm(false);
          setBookingToRebook(null);
        }}
        isLoading={rebookLoading}
      />
    </section>
  );
};

export default BookingsPage;
