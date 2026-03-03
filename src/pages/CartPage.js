// pages/CartPage.jsx
import React from 'react';
import './CartPage.css';

const CartPage = ({ isActive, cartItems, removeFromCart }) => {
  if (!isActive) return null;

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price, 0);
  };

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-header">
          <h1>🛒 Your Cart</h1>
          <p className="cart-subtitle">Review your selected services</p>
        </div>
        
        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <div className="empty-cart-icon">🛒</div>
            <h3>Your cart is empty</h3>
            <p>Add services to get started</p>
          </div>
        ) : (
          <div className="cart-items">
            {cartItems.map((item, index) => (
              <div key={`${item.id}-${index}`} className="cart-item">
                <div className="cart-item-info">
                  <h3 className="cart-item-name">{item.name}</h3>
                  <p className="cart-item-type">{item.serviceType}</p>
                </div>
                <div className="cart-item-actions">
                  <span className="cart-item-price">₹{item.price}</span>
                  <button 
                    className="cart-remove-btn"
                    onClick={() => removeFromCart(item.name)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            
            <div className="cart-summary">
              <div className="cart-total">
                <span>Total</span>
                <span className="total-amount">₹{getCartTotal()}</span>
              </div>
              <button className="checkout-btn">Proceed to Checkout</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;

