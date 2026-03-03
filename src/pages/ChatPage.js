// pages/ChatPage.jsx
import React, { useState } from 'react';

const ChatPage = ({ isActive, onOpenChat, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  // Empty messages array - no dummy data
  const messages = [];

  const tabs = ['All', 'Unread', 'Archived'];

  return (
    <section className={`page ${isActive ? '' : 'hidden'}`} id="page-chat">
      <div className="chat-header">
        <h1>Messages</h1>
        <button className="compose-btn">✏️</button>
      </div>

      <div className="search-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="chat-tabs">
        {tabs.map(tab => (
          <button 
            key={tab}
            className={`chat-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="chat-list" id="chatList">
        {messages.length === 0 ? (
          <div className="chat-item empty-chat">
            <div className="empty-chat-icon">💬</div>
            <p>No messages yet</p>
            <button className="btn-book" onClick={() => onNavigate('services', null)}>
              Book a Service
            </button>
          </div>
        ) : (
          messages.map(chat => (
            <div key={chat.id} className="chat-item" onClick={() => onOpenChat(chat.name)}>
              <div className="chat-avatar" style={{ background: chat.color }}>
                {chat.avatar}
              </div>
              <div className="chat-info">
                <div className="chat-name-row">
                  <span className="chat-name">{chat.name}</span>
                  <span className="chat-time">{chat.time}</span>
                </div>
                <span className="chat-preview">{chat.preview}</span>
                <div className="chat-tags">
                  <span className="tag-service">{chat.service}</span>
                </div>
              </div>
              {chat.unread > 0 && <div className="unread-badge">{chat.unread}</div>}
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default ChatPage;
