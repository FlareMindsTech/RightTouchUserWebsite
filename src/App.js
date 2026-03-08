// App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './styles/main.css';
// Import components
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import ServicePage from './pages/ServicePage';
import ProductServices from './pages/ProductServices';
import AccountPage from './pages/AccountPage';
import CartPage from './pages/CartPage';
import BookingsPage from './pages/BookingsPage';
import ServiceSheet from './components/ServiceSheet';
import ChatWindow from './components/ChatWindow';
import AuthDialog from './components/AuthDialog';
import RegisterDialog from './components/RegisterDialog';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProductPage from './pages/ProductPage';
import ProductDetailPage from './pages/ProductDetailPage';
import PaymentMethodsPage from './pages/PaymentMethodsPage';
import { MdSearch, MdShoppingCart } from 'react-icons/md';
import logo from './assets/logo.png';
import { getMyCart, addToCart as apiAddToCart, updateCartItem, removeFromCart as apiRemoveFromCart } from './services/cartService';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [toast, setToast] = useState({ show: false, message: '' });
  const [showServiceSheet, setShowServiceSheet] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState(null);
  const [cartItems, setCartItems] = useState([]);

  // Auth states
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Get current page from URL path
  const getCurrentPageFromPath = () => {
    const path = location.pathname.replace('/', '') || 'home';
    return path;
  };

  const currentPage = getCurrentPageFromPath();

  // Check for user login on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('token');

    if (savedUser && savedToken) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user:', e);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
      }
    } else if (savedUser || savedToken) {
      // Clear inconsistent state
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
    }

    // Check for dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.body.classList.add('dark-mode');
    }
    // Listen for custom events
    const handleLogoutEvent = () => setCurrentUser(null);
    const handleProfileUpdateEvent = () => {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) setCurrentUser(JSON.parse(savedUser));
    };

    window.addEventListener('userLoggedOut', handleLogoutEvent);
    window.addEventListener('userProfileUpdated', handleProfileUpdateEvent);

    if (savedUser && savedToken) {
      fetchCart();
    }

    return () => {
      window.removeEventListener('userLoggedOut', handleLogoutEvent);
      window.removeEventListener('userProfileUpdated', handleProfileUpdateEvent);
    };
  }, []);

  const fetchCart = async () => {
    try {
      const response = await getMyCart();
      if (response?.success && response.result) {
        // The backend returns an array of cart items directly in response.result
        const items = Array.isArray(response.result) ? response.result : (response.result.items || []);

        setCartItems(items.map(cartItem => {
          const detail = cartItem.item || {};
          return {
            ...cartItem,
            name: detail.productName || detail.serviceName || 'Unknown Item',
            price: detail.discountedPrice || detail.serviceCost || detail.productPrice || detail.estimatedPriceFrom || 0,
            id: cartItem._id, // Backend cart item ID
            originalId: cartItem.itemId, // Original Product/Service ID
            itemType: cartItem.itemType,
            image: detail.productImages?.[0] || detail.serviceImages?.[0]
          };
        }));
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  };

  const handleNavigate = (page, element = null) => {
    // If element is a string, treat it as service type
    if (typeof element === 'string') {
      setSelectedServiceType(element);
      navigate(`/product-services?type=${encodeURIComponent(element)}`);
    } else {
      navigate(`/${page === 'home' ? '' : page}`);
    }

    // Update active classes for navigation links
    if (element && typeof element === 'object') {
      document.querySelectorAll('.nav-link, .bottom-tab').forEach(el => {
        el.classList.remove('active');
      });
      element.classList.add('active');
    }
  };

  // Cart functions
  const addToCart = async (itemData) => {
    // Check if user is logged in
    if (!currentUser) {
      setShowLoginDialog(true);
      return;
    }

    try {
      const payload = {
        itemId: itemData._id || itemData.itemId || itemData.id,
        itemType: itemData.itemType,
        quantity: itemData.quantity || 1
      };
      console.log("[App.js] addToCart payload:", payload);

      const response = await apiAddToCart(payload);

      if (response?.success) {
        showToast(`Item added to cart`);
        fetchCart();
      } else {
        showToast(response?.message || 'Failed to add to cart');
      }
    } catch (error) {
      showToast('Error adding to cart');
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const response = await apiRemoveFromCart(itemId);
      if (response?.success) {
        showToast('Item removed from cart');
        fetchCart();
      } else {
        showToast('Failed to remove item');
      }
    } catch (error) {
      showToast('Error removing from cart');
    }
  };

  const updateQuantity = async (itemId, itemType, newQuantity) => {
    try {
      const response = await updateCartItem({
        itemId, // This is the original item ID
        itemType,
        quantity: newQuantity
      });
      if (response?.success) {
        fetchCart();
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const isInCart = (targetId) => {
    return cartItems.some(item => (item.itemId?._id || item.originalId) === targetId);
  };

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const openServiceSheet = (service) => {
    setSelectedService(service);
    setShowServiceSheet(true);
    document.body.style.overflow = 'hidden';
  };

  const closeServiceSheet = () => {
    setShowServiceSheet(false);
    document.body.style.overflow = 'auto';
  };

  const closeChat = () => {
    setShowChatWindow(false);
    setSelectedChat(null);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);

    if (newDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  const handleCartClick = () => {
    navigate('/cart');
  };

  // Auth handlers
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    showToast(`Welcome back, ${user.name || 'User'}!`);
  };

  const handleRegisterSuccess = (user) => {
    setCurrentUser(user);
    showToast(`Welcome, ${user.name}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    showToast('Logged out successfully');
  };

  const openLoginFromRegister = () => {
    setShowRegisterDialog(false);
    setShowLoginDialog(true);
  };

  const openRegisterFromLogin = () => {
    setShowLoginDialog(false);
    setShowRegisterDialog(true);
  };

  return (
    <div className="App">
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        cartItemCount={cartItems.length}
        currentUser={currentUser}
        onLoginClick={() => setShowLoginDialog(true)}
        onLogout={handleLogout}
      />

      {/* Global Mobile Header - shows on all pages */}
      <div className="global-mobile-header mobile-only">
        <div className="gmh-left">
          <img src={logo} alt="RightTouch" className="gmh-logo" />
          {/* <span className="gmh-title">RightTouch</span> */}
        </div>
        <div className="gmh-right">
          <div className="gmh-search">
            <MdSearch className="gmh-search-icon" />
            <input type="text" placeholder="Search..." />
          </div>
          <button className="gmh-cart-btn" onClick={handleCartClick}>
            <MdShoppingCart className="gmh-cart-icon" />
            {cartItems.length > 0 && <span className="gmh-cart-badge">{cartItems.length}</span>}
          </button>
        </div>
      </div>

      <main className="page-wrapper">
        <Routes>
          <Route path="/" element={
            <HomePage
              isActive={currentPage === 'home'}
              onNavigate={handleNavigate}
              onOpenService={openServiceSheet}
              showToast={showToast}
            />
          } />
          <Route path="/home" element={
            <HomePage
              isActive={currentPage === 'home'}
              onNavigate={handleNavigate}
              onOpenService={openServiceSheet}
              showToast={showToast}
            />
          } />
          <Route path="/services" element={
            <ServicePage
              isActive={currentPage === 'services'}
              onNavigate={handleNavigate}
              onOpenServiceDetail={openServiceSheet}
              addToCart={addToCart}
              isInCart={isInCart}
              removeFromCart={removeFromCart}
              cartItems={cartItems}
            />
          } />
          <Route path="/product-services" element={
            <ProductServices
              isActive={currentPage === 'product-services'}
              onNavigate={handleNavigate}
              selectedServiceType={selectedServiceType}
              setSelectedServiceType={setSelectedServiceType}
              cartItems={cartItems}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
              isInCart={isInCart}
              showToast={showToast}
            />
          } />
          <Route path="/account" element={
            <AccountPage
              isActive={currentPage === 'account'}
              isDarkMode={isDarkMode}
              onToggleDarkMode={toggleDarkMode}
              showToast={showToast}
              onNavigate={handleNavigate}
              currentUser={currentUser}
              onLoginClick={() => setShowLoginDialog(true)}
            />
          } />
          <Route path="/payment-methods" element={
            <PaymentMethodsPage
              isActive={currentPage === 'payment-methods'}
              showToast={showToast}
            />
          } />
          <Route path="/bookings" element={
            <BookingsPage
              isActive={currentPage === 'bookings'}
              showToast={showToast}
              cartItemCount={cartItems.length}
            />
          } />
          <Route path="/cart" element={
            <CartPage
              isActive={currentPage === 'cart'}
              cartItems={cartItems}
              removeFromCart={removeFromCart}
              updateQuantity={updateQuantity}
              showToast={showToast}
              currentUser={currentUser}
              fetchCart={fetchCart}
            />
          } />
          <Route path="/product-detail" element={
            <ProductDetailPage
              isActive={currentPage === 'product-detail'}
              showToast={showToast}
              addToCart={addToCart}
              isInCart={isInCart}
              removeFromCart={removeFromCart}
              cartItems={cartItems}
            />
          } />
          <Route path="/products" element={
            <ProductPage
              isActive={currentPage === 'products'}
              onNavigate={handleNavigate}
              addToCart={addToCart}
              isInCart={isInCart}
              removeFromCart={removeFromCart}
              cartItems={cartItems}
            />
          } />
          <Route path="/forgot-password" element={
            <ForgotPasswordPage
              onBackToLogin={() => {
                navigate('/');
                setShowLoginDialog(true);
              }}
            />
          } />
        </Routes>
      </main>

      <BottomNav currentPage={currentPage} onNavigate={handleNavigate} />

      {showServiceSheet && (
        <ServiceSheet
          service={selectedService}
          onClose={closeServiceSheet}
          showToast={showToast}
        />
      )}

      {showChatWindow && (
        <ChatWindow
          chatName={selectedChat}
          onClose={closeChat}
        />
      )}

      {/* Auth Dialogs */}
      <AuthDialog
        isOpen={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        onLoginSuccess={handleLoginSuccess}
        onNavigateToRegister={openRegisterFromLogin}
        onNavigateToForgotPassword={() => {
          setShowLoginDialog(false);
          navigate('/forgot-password');
        }}
        onShowToast={showToast}
      />

      <RegisterDialog
        isOpen={showRegisterDialog}
        onClose={() => setShowRegisterDialog(false)}
        onRegisterSuccess={handleRegisterSuccess}
        onNavigateToLogin={openLoginFromRegister}
        onShowToast={showToast}
      />

      {toast.show && <div className="toast">{toast.message}</div>}
    </div>
  );
}

export default App;

