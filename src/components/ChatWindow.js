// components/ChatWindow.jsx
import React, { useState } from 'react';

const ChatWindow = ({ chatName, onClose }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! Your technician will arrive in 30 minutes. 😊", time: '10:30 AM', type: 'received' },
    { id: 2, text: "Great! Thank you for the update.", time: '10:31 AM', type: 'sent' },
    { id: 3, text: "He'll call you before arriving. Please keep your door open.", time: '10:32 AM', type: 'received' }
  ]);

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'sent'
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('') : 'UK';
  };

  return (
    <div className="chat-window">
      <div className="chat-win-header">
        <button className="back-btn" onClick={onClose}>←</button>
        <div className="chat-win-avatar" style={{ background: '#22c55e' }}>
          {getInitials(chatName)}
        </div>
        <div className="chat-win-name">{chatName}</div>
        <span className="online-dot"></span>
      </div>
      
      <div className="chat-messages" id="chatMessages">
        {messages.map(msg => (
          <div key={msg.id} className={`msg msg-${msg.type}`}>
            <div className="msg-bubble">{msg.text}</div>
            <div className="msg-time">{msg.time}</div>
          </div>
        ))}
      </div>
      
      <div className="chat-input-bar">
        <button className="attach-btn">📎</button>
        <input 
          type="text" 
          placeholder="Type a message..." 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="send-btn" onClick={sendMessage}>➤</button>
      </div>
    </div>
  );
};

export default ChatWindow;