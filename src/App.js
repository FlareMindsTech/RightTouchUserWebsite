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
import ChatPage from './pages/ChatPage';
import AccountPage from './pages/AccountPage';
import CartPage from './pages/CartPage';
import BookingsPage from './pages/BookingsPage';
import ServiceSheet from './components/ServiceSheet';
import ChatWindow from './components/ChatWindow';

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

  // Get current page from URL path
  const getCurrentPageFromPath = () => {
    const path = location.pathname.replace('/', '') || 'home';
    return path;
  };
  
  const currentPage = getCurrentPageFromPath();

  // Check for dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.body.classList.add('dark-mode');
    }
  }, []);

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
  const addToCart = (item) => {
    setCartItems([...cartItems, item]);
    showToast(`${item.name} added to cart`);
  };

  const removeFromCart = (itemName) => {
    setCartItems(cartItems.filter(item => item.name !== itemName));
    showToast(`${itemName} removed from cart`);
  };

  const isInCart = (itemName) => {
    return cartItems.some(item => item.name === itemName);
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

  const openChat = (chatName) => {
    setSelectedChat(chatName);
    setShowChatWindow(true);
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

  return (
    <div className="App">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
      
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
          <Route path="/chat" element={
            <ChatPage 
              isActive={currentPage === 'chat'}
              onOpenChat={openChat}
              onNavigate={handleNavigate}
            />
          } />
          <Route path="/account" element={
            <AccountPage 
              isActive={currentPage === 'account'}
              isDarkMode={isDarkMode}
              onToggleDarkMode={toggleDarkMode}
              showToast={showToast}
              onNavigate={handleNavigate}
            />
          } />
          <Route path="/bookings" element={
            <BookingsPage 
              isActive={currentPage === 'bookings'}
              showToast={showToast}
            />
          } />
          <Route path="/cart" element={
            <CartPage 
              isActive={currentPage === 'cart'}
              cartItems={cartItems}
              removeFromCart={removeFromCart}
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

      {toast.show && <div className="toast">{toast.message}</div>}
    </div>
  );
}

export default App;