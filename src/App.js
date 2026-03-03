// App.js
import React, { useState, useEffect } from 'react';
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
  const [currentPage, setCurrentPage] = useState(() => {
    // Load saved page from localStorage on initial render
    return localStorage.getItem('currentPage') || 'home';
  });
  const [toast, setToast] = useState({ show: false, message: '' });
  const [showServiceSheet, setShowServiceSheet] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState(null);
  const [cartItems, setCartItems] = useState([]);

  // Check for dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.body.classList.add('dark-mode');
    }
  }, []);

  // Save current page to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  const navigate = (page, element = null) => {
    // If element is a string, treat it as service type
    if (typeof element === 'string') {
      setSelectedServiceType(element);
    }
    setCurrentPage(page);
    
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
      <Navbar currentPage={currentPage} onNavigate={navigate} />
      
      <main className="page-wrapper">
        <HomePage 
          isActive={currentPage === 'home'} 
          onNavigate={navigate}
          onOpenService={openServiceSheet}
          showToast={showToast}
        />
        
        <ServicePage 
          isActive={currentPage === 'services'} 
          onNavigate={navigate}
          onOpenServiceDetail={openServiceSheet}
        />
        
        <ProductServices 
          isActive={currentPage === 'product-services'} 
          onNavigate={navigate}
          selectedServiceType={selectedServiceType}
          cartItems={cartItems}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
          isInCart={isInCart}
          showToast={showToast}
        />
        
        <ChatPage 
          isActive={currentPage === 'chat'} 
          onOpenChat={openChat}
          onNavigate={navigate}
        />
        
        <AccountPage 
          isActive={currentPage === 'account'}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          showToast={showToast}
          onNavigate={navigate}
        />
        
        <BookingsPage 
          isActive={currentPage === 'bookings'}
          showToast={showToast}
        />
        
        <CartPage 
          isActive={currentPage === 'cart'}
          cartItems={cartItems}
          removeFromCart={removeFromCart}
        />
      </main>

      <BottomNav currentPage={currentPage} onNavigate={navigate} />

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