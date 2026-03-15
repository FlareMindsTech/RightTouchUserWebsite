import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './styles/main.css';
import './styles/gmh-cart-pill.css';
// Import components
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import ServicePage from './pages/ServicePage';
import ProductServices from './pages/ProductServices';
import AccountPage from './pages/AccountPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import BookingsPage from './pages/BookingsPage';
import ServiceSheet from './components/ServiceSheet';
// import ChatWindow from './components/ChatWindow';
import AuthDialog from './components/AuthDialog';
import RegisterDialog from './components/RegisterDialog';
import Footer from './components/Footer';
import ProductPage from './pages/ProductPage';
import ProductDetailPage from './pages/ProductDetailPage';
import PaymentMethodsPage from './pages/PaymentMethodsPage';
import SettingsPage from './pages/SettingsPage';
import RatingsPage from './pages/RatingsPage';
import ReportPage from './pages/ReportPage';
import HelpSupportPage from './pages/HelpSupportPage';
import { MdSearch, MdShoppingCart } from 'react-icons/md';
import logo from './assets/logo.png';
import { getAllCategories } from './services/categoryService';
import { getAllServices } from './services/serviceService';
import { getAllProducts } from './services/productService';
import { getMyCart, addToCart as apiAddToCart, updateCartItem, removeFromCart as apiRemoveFromCart } from './services/cartService';
import { RtAlertContainer, rtAlert } from './components/RtAlert';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [showServiceSheet, setShowServiceSheet] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Auth states
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Search state
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Global Data Store (Production-Level Caching)
  const [serviceCategories, setServiceCategories] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const dataFetchedRef = useRef(false);

  // Get current page from URL path
  const getCurrentPageFromPath = () => {
    const path = location.pathname.replace('/', '') || 'home';
    return path;
  };

  const currentPage = getCurrentPageFromPath();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Check for user login on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('token');

    try {
      const parsed = JSON.parse(savedUser);
      if (parsed && (parsed._id || parsed.userId)) {
        // Ensure _id is present for consistency
        if (!parsed._id && parsed.userId) parsed._id = parsed.userId;
        setCurrentUser(parsed);
      }
    } catch (e) {
      console.error('Failed to parse saved user:', e);
      localStorage.removeItem('currentUser');
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
      const savedUserStr = localStorage.getItem('currentUser');
      if (savedUserStr) {
        const parsedUser = JSON.parse(savedUserStr);
        setCurrentUser(prev => {
          // Only update state if data actually changed to prevent infinite loops
          if (JSON.stringify(prev) === savedUserStr) return prev;
          return parsedUser;
        });
      }
    };

    window.addEventListener('userLoggedOut', handleLogoutEvent);
    window.addEventListener('userProfileUpdated', handleProfileUpdateEvent);

    if (savedUser && savedToken) {
      fetchCart();
    }

    // Global data fetching
    const fetchGlobalData = async () => {
      if (dataFetchedRef.current) return;
      try {
        const [servCatRes, prodCatRes, servRes, prodRes] = await Promise.all([
          getAllCategories({ categoryType: 'service' }),
          getAllCategories({ categoryType: 'product' }),
          getAllServices(),
          getAllProducts()
        ]);

        const servCats = servCatRes?.result || servCatRes?.data || servCatRes;
        if (Array.isArray(servCats)) setServiceCategories(servCats);

        const prodCats = prodCatRes?.result || prodCatRes?.data || prodCatRes;
        if (Array.isArray(prodCats)) setProductCategories(prodCats);

        const servs = Array.isArray(servRes?.result) ? servRes.result : (servRes?.result?.services || servRes?.data || servRes);
        if (Array.isArray(servs)) setAllServices(servs);

        const prods = prodRes?.result || prodRes?.data || prodRes?.products || prodRes;
        if (Array.isArray(prods)) {
          setAllProducts(prods);
        } else if (prodRes?.result?.products) {
          setAllProducts(prodRes.result.products);
        }

        setIsDataLoaded(true);
        dataFetchedRef.current = true;
      } catch (err) {
        console.error("Error fetching global data:", err);
      }
    };

    fetchGlobalData();

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

  const handleNavigate = useCallback((page, element = null) => {
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
  }, [navigate]);

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

  const showToast = useCallback((message, type) => {
    if (type) {
      rtAlert(message, type);
      return;
    }
    const msg = String(message || '').toLowerCase();
    const isError   = ['error', 'failed', 'invalid', 'unable'].some(k => msg.includes(k));
    const isWarning = ['cancelled', 'already', 'disabled', 'pending', 'option will be', 'not available'].some(k => msg.includes(k));
    rtAlert(message, isError ? 'error' : isWarning ? 'warning' : 'success');
  }, []);

  const openServiceSheet = (service) => {
    setSelectedService(service);
    setShowServiceSheet(true);
    document.body.style.overflow = 'hidden';
  };

  const closeServiceSheet = () => {
    setShowServiceSheet(false);
    document.body.style.overflow = 'auto';
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
    if (user?.token) {
      localStorage.setItem('token', user.token);
    }
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);
    fetchCart();
    const displayName = user.name || user.fname || user.identifier || 'User';
    showToast(`Welcome back, ${displayName}!`);
  };

  const handleRegisterSuccess = (user) => {
    if (user?.token) {
      localStorage.setItem('token', user.token);
    }
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);
    fetchCart();
    const displayName = user.name || user.fname || user.identifier || 'User';
    showToast(`Welcome, ${displayName}!`);
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

  const cartTotalQuantity = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  return (
    <div className="App">
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
          cartItemCount={cartTotalQuantity}
        currentUser={currentUser}
        onLoginClick={() => setShowLoginDialog(true)}
        onLogout={handleLogout}
        searchQuery={globalSearchQuery}
        onSearchChange={setGlobalSearchQuery}
      />

      {/* Global Mobile Header - shows on all pages */}
      <div className="global-mobile-header mobile-only">
        <div className="gmh-left">
          {currentPage !== 'home' && (
            <img src={logo} alt="RightTouch" className="gmh-logo gmh-logo-mini" />
          )}
          {['bookings', 'cart', 'checkout', 'account', 'settings', 'payment-methods', 'services'].includes(currentPage) ? (
            <h1 className="gmh-title">{currentPage.charAt(0).toUpperCase() + currentPage.slice(1).replace('-', ' ')}</h1>
          ) : currentPage === 'home' ? (
            <img src={logo} alt="RightTouch" className="gmh-logo" />
          ) : null}
        </div>
        {cartTotalQuantity > 0 && !['cart', 'checkout'].includes(currentPage) && (
          <button className="gmh-cart-pill" onClick={handleCartClick}>
            <MdShoppingCart size={14} />
            <span>{cartTotalQuantity} {cartTotalQuantity === 1 ? 'item' : 'items'} in cart</span>
          </button>
        )}
        <div className="gmh-right">

          {!['bookings', 'cart', 'checkout', 'account', 'settings', 'payment-methods', 'services'].includes(currentPage) && (
            <div className="gmh-search">
              <MdSearch className="gmh-search-icon" />
              <input
                type="text"
                placeholder="Search..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
              />
            </div>
          )}
          <button className="gmh-cart-btn" onClick={handleCartClick}>
            <MdShoppingCart className="gmh-cart-icon" />
            {cartTotalQuantity > 0 && <span className="gmh-cart-badge">{cartTotalQuantity}</span>}
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
              searchQuery={globalSearchQuery}
              serviceCategories={serviceCategories}
              productCategories={productCategories}
              services={allServices}
              loading={!isDataLoaded}
            />
          } />
          <Route path="/home" element={
            <HomePage
              isActive={currentPage === 'home'}
              onNavigate={handleNavigate}
              onOpenService={openServiceSheet}
              showToast={showToast}
              searchQuery={globalSearchQuery}
              serviceCategories={serviceCategories}
              productCategories={productCategories}
              services={allServices}
              loading={!isDataLoaded}
            />
          } />
          <Route path="/services" element={
            <ServicePage
              isActive={currentPage === 'services'}
              onNavigate={handleNavigate}
              onOpenServiceDetail={openServiceSheet}
              addToCart={addToCart}
              cartItems={cartItems}
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
              showToast={showToast}
              isInCart={isInCart}
              searchQuery={globalSearchQuery}
              categories={serviceCategories}
              allServices={allServices}
              dataLoading={!isDataLoaded}
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
              updateQuantity={updateQuantity}
              isInCart={isInCart}
              showToast={showToast}
              allServices={allServices}
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
              currentUser={currentUser}
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
            <Route path="/checkout" element={
              <CheckoutPage
                isActive={currentPage === 'checkout'}
                cartItems={cartItems}
                removeFromCart={removeFromCart}
                updateQuantity={updateQuantity}
                fetchCart={fetchCart}
                showToast={showToast}
                currentUser={currentUser}
                onNavigate={handleNavigate}
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
              productCategories={productCategories}
              allProducts={allProducts}
              dataLoading={!isDataLoaded}
            />
          } />
          <Route path="/settings" element={
            <SettingsPage
              isActive={currentPage === 'settings'}
              isDarkMode={isDarkMode}
              onToggleDarkMode={toggleDarkMode}
              showToast={showToast}
            />
          } />
          <Route path="/ratings" element={<RatingsPage showToast={showToast} />} />
          <Route path="/report" element={<ReportPage showToast={showToast} />} />
          <Route path="/help" element={<HelpSupportPage showToast={showToast} />} />
        </Routes>
      </main>

      <Footer />

      <BottomNav currentPage={currentPage} onNavigate={handleNavigate} currentUser={currentUser} />

      {showServiceSheet && (
        <ServiceSheet
          service={selectedService}
          onClose={closeServiceSheet}
          showToast={showToast}
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

      <RtAlertContainer />
    </div>
  );
}

export default App;