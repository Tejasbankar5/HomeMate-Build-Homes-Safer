// src/components/Chat.js
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './chat.css'
// Connect to the server
const socket = io("http://localhost:8080");

// Mock chat data with additional details
const mockChats = [
  { 
    id: 1, 
    name: "Shreyas meshram", 
    avatar: "JD", 
    status: "online",
    lastMessage: "Hey, how are you?", 
    time: "10:30 AM", 
    unread: 0,
    isGroup: false
  },
  { 
    id: 2, 
    name: "sujal gaikwad", 
    avatar: "SG", 
    status: "",
    lastMessage: "", 
    time: "Yesterday", 
    unread: 0,
    isGroup: false
  },
  { 
    id: 3, 
    name: "Rajesh Bankar", 
    avatar: "WG", 
    status: "",
    lastMessage: "", 
    time: "Yesterday", 
    unread: 0,
    isGroup: true
  },
  { 
    id: 4, 
    name: "Arvind Kejriwal", 
    avatar: "M", 
    status: "",
    lastMessage: "", 
    time: "", 
    unread: 0,
    isGroup: false
  },
];

// Quick reply suggestions
const quickReplies = [
  "Yes, that works for me!",
  "I'll get back to you soon",
  "Can we schedule a meeting?",
  "Thanks for letting me know",
  "I'm busy right now, talk later?"
];

// Pre-built meeting templates
const meetingTemplates = [
  {
    title: "Quick Sync",
    duration: "15 min",
    message: "Let's have a quick sync meeting to discuss this. Are you available?"
  },
  {
    title: "Project Review",
    duration: "30 min",
    message: "We should schedule a project review meeting. When works for you?"
  },
  {
    title: "Brainstorming",
    duration: "1 hour",
    message: "I'd like to schedule a brainstorming session about this topic. What's your availability?"
  }
];

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Listen for new messages from the server
    socket.on('newMessage', (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    // Clean up on component unmount
    return () => {
      socket.off('newMessage');
    };
  }, []);

  // Handle sending a message
  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const newMsg = { text: message, sender: 'me', timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
      socket.emit('sendMessage', message); // Emit message to server
      setMessages(prev => [...prev, newMsg]);
      setMessage('');
      setShowQuickReplies(false);
    }
  };

  // Send a quick reply
  const sendQuickReply = (reply) => {
    const newMsg = { text: reply, sender: 'me', timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
    socket.emit('sendMessage', reply);
    setMessages(prev => [...prev, newMsg]);
    setShowQuickReplies(false);
  };

  // Schedule and send a meeting request
  const sendMeetingRequest = () => {
    if (!selectedTemplate || !selectedDate || !selectedTime) return;
    
    const meetingMessage = `${selectedTemplate.message} I'm proposing ${selectedDate} at ${selectedTime}.`;
    const newMsg = { 
      text: meetingMessage, 
      sender: 'me', 
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      isMeeting: true,
      meetingDetails: {
        date: selectedDate,
        time: selectedTime,
        duration: selectedTemplate.duration,
        title: selectedTemplate.title
      }
    };
    
    socket.emit('sendMessage', meetingMessage);
    setMessages(prev => [...prev, newMsg]);
    setShowMeetingModal(false);
    setSelectedTemplate(null);
    setSelectedDate('');
    setSelectedTime('');
  };

  // Load a chat when clicked
  const loadChat = (chatId) => {
    setActiveChat(chatId);
    // In a real app, you would fetch messages for this chat from the server
    setMessages([
      { 
        text: "Hello there! How are you doing today?", 
        sender: "other", 
        timestamp: "10:15 AM",
        suggestions: ["I'm good, thanks!", "Could be better", "Busy with work"]
      },
      { 
        text: "Hi! I'm good, thanks for asking!", 
        sender: "me", 
        timestamp: "10:16 AM" 
      },
      { 
        text: "We need to schedule a meeting to discuss the project updates. When are you available?", 
        sender: "other", 
        timestamp: "10:18 AM",
        suggestions: ["How about tomorrow?", "Can we do it next week?", "I'll check my calendar"]
      },
    ]);
  };

  // Format message time
  const formatMessageTime = (timestamp) => {
    return timestamp || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <div className="whatsapp-container">
      {/* Sidebar with chat list */}
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <div className="profile-section">
            <div className="profile-avatar">YP</div>
            <h2>Your Profile</h2>
          </div>
          <button className="new-chat-button">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M19.005 3.175H4.674C3.642 3.175 3 3.789 3 4.821V21.02l3.544-3.514h12.461c1.033 0 2.064-1.06 2.064-2.093V4.821c-.001-1.032-1.032-1.646-2.064-1.646zm-4.989 9.869H7.041V11.1h6.975v1.944zm3-4H7.041V7.1h9.975v1.944z" />
            </svg>
          </button>
        </div>
        
        <div className="search-bar">
          <input type="text" placeholder="Search or start new chat" />
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z" />
          </svg>
        </div>
        
        <div className="chat-list">
          {mockChats.map((chat) => (
            <div 
              key={chat.id} 
              className={`chat-item ${activeChat === chat.id ? 'active' : ''}`}
              onClick={() => loadChat(chat.id)}
            >
              <div className="chat-avatar" style={{backgroundColor: `#${Math.floor(Math.random()*16777215).toString(16)}`}}>
                <div className="avatar-placeholder">{chat.avatar}</div>
                {chat.status === "online" && <div className="online-indicator"></div>}
              </div>
              <div className="chat-info">
                <div className="chat-name">{chat.name}</div>
                <div className="chat-preview">
                  {chat.isGroup && <span className="sender-name">{chat.lastMessage.split(':')[0]}:</span>}
                  {chat.lastMessage.split(':').slice(chat.isGroup ? 1 : 0).join(':')}
                </div>
              </div>
              <div className="chat-meta">
                <div className="chat-time">{chat.time}</div>
                {chat.unread > 0 && <div className="unread-count">{chat.unread}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="chat-main">
        {activeChat ? (
          <>
            <div className="chat-header">
              <div className="header-info-container">
                <div className="header-avatar" style={{backgroundColor: `#${Math.floor(Math.random()*16777215).toString(16)}`}}>
                  {mockChats.find(c => c.id === activeChat)?.avatar}
                  {mockChats.find(c => c.id === activeChat)?.status === "online" && 
                    <div className="online-indicator"></div>}
                </div>
                <div className="header-info">
                  <div className="header-name">{mockChats.find(c => c.id === activeChat)?.name}</div>
                  <div className="header-status">{mockChats.find(c => c.id === activeChat)?.status}</div>
                </div>
              </div>
              <div className="header-actions">
                <button className="action-button">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="chat-messages">
              <div className="date-divider">
                <span>Today</span>
              </div>
              
              {messages.map((msg, index) => (
                <React.Fragment key={index}>
                  <div className={`message ${msg.sender === 'me' ? 'sent' : 'received'}`}>
                    <div className="message-content">
                      {msg.isMeeting && (
                        <div className="meeting-card">
                          <div className="meeting-title">{msg.meetingDetails?.title || 'Meeting Request'}</div>
                          <div className="meeting-details">
                            <div className="detail-item">
                              <svg viewBox="0 0 24 24" width="16" height="16">
                                <path fill="currentColor" d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" />
                                <path fill="currentColor" d="M13 7h-2v5.414l3.293 3.293 1.414-1.414L13 11.586z" />
                              </svg>
                              <span>{msg.meetingDetails?.duration}</span>
                            </div>
                            <div className="detail-item">
                              <svg viewBox="0 0 24 24" width="16" height="16">
                                <path fill="currentColor" d="M19 4h-2V2h-2v2H9V2H7v2H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2zm-1 15h-6v-6h6v6zm1-10H5V7h14v2z" />
                              </svg>
                              <span>{msg.meetingDetails?.date} at {msg.meetingDetails?.time}</span>
                            </div>
                          </div>
                          <div className="meeting-actions">
                            <button className="accept-button">Accept</button>
                            <button className="propose-button">Propose New Time</button>
                          </div>
                        </div>
                      )}
                      <div className="message-text">{msg.text}</div>
                      <div className="message-meta">
                        <div className="message-time">{formatMessageTime(msg.timestamp)}</div>
                        {msg.sender === 'me' && (
                          <div className="message-status">
                            <svg viewBox="0 0 24 24" width="14" height="14">
                              <path fill="currentColor" d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41 4.24 4.24 8.49-8.48-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {msg.suggestions && msg.sender !== 'me' && (
                    <div className="suggestions-container">
                      {msg.suggestions.map((suggestion, i) => (
                        <button 
                          key={i} 
                          className="suggestion-button"
                          onClick={() => sendQuickReply(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {showQuickReplies && (
              <div className="quick-replies-container">
                <div className="quick-replies-header">
                  <span>Quick Replies</span>
                  <button onClick={() => setShowQuickReplies(false)}>×</button>
                </div>
                <div className="quick-replies-list">
                  {quickReplies.map((reply, index) => (
                    <button 
                      key={index} 
                      className="quick-reply"
                      onClick={() => sendQuickReply(reply)}
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <form onSubmit={sendMessage} className="message-input-container">
              <button 
                type="button" 
                className="emoji-button"
                onClick={() => setShowQuickReplies(!showQuickReplies)}
              >
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" />
                  <circle cx="8.5" cy="10.5" r="1.5" fill="currentColor" />
                  <circle cx="15.5" cy="10.5" r="1.5" fill="currentColor" />
                  <path fill="currentColor" d="M12 18c4 0 5-4 5-4H7s1 4 5 4z" />
                </svg>
              </button>
              <button type="button" className="attach-button">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 0 1 5 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5a2.5 2.5 0 0 0 5 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" />
                </svg>
              </button>
              <button 
                type="button" 
                className="meeting-button"
                onClick={() => setShowMeetingModal(true)}
              >
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M17 12c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5 5-2.24 5-5zm-5 3c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3zm-7-5c0-2.76 2.24-5 5-5s5 2.24 5 5v1h1.07c.6 0 1.07.48 1.07 1.07v9.86c0 .6-.48 1.07-1.07 1.07H4.93c-.6 0-1.07-.48-1.07-1.07V11.07c0-.6.48-1.07 1.07-1.07H6v-1z" />
                </svg>
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message"
                className="message-input"
              />
              <button type="submit" className="send-button">
                {message.trim() ? (
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />
                  </svg>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="chat-placeholder">
            <div className="placeholder-content">
              <div className="placeholder-icon">
                <svg viewBox="0 0 24 24" width="120" height="120">
                  <path fill="#808080" d="M19.005 3.175H4.674C3.642 3.175 3 3.789 3 4.821V21.02l3.544-3.514h12.461c1.033 0 2.064-1.06 2.064-2.093V4.821C21.068 3.789 20.037 3.175 19.005 3.175zm-4.989 9.869H7.041V11.1h6.975v1.944zm3-4H7.041V7.1h9.975v1.944z" />
                </svg>
              </div>
              <h2>WhatsApp Web</h2>
              <p>Select a chat to start messaging</p>
              <div className="placeholder-features">
                <div className="feature-item">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="#25D366" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z" />
                  </svg>
                  <span>End-to-end encrypted</span>
                </div>
                <div className="feature-item">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="#25D366" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />
                  </svg>
                  <span>Schedule meetings directly in chat</span>
                </div>
                <div className="feature-item">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="#25D366" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z" />
                  </svg>
                  <span>Smart reply suggestions</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Meeting Scheduling Modal */}
      {showMeetingModal && (
        <div className="modal-overlay">
          <div className="meeting-modal">
            <div className="modal-header">
              <h3>Schedule a Meeting</h3>
              <button onClick={() => setShowMeetingModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="template-section">
                <h4>Meeting Templates</h4>
                <div className="template-list">
                  {meetingTemplates.map((template, index) => (
                    <div 
                      key={index} 
                      className={`template-card ${selectedTemplate === template ? 'selected' : ''}`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <div className="template-title">{template.title}</div>
                      <div className="template-duration">{template.duration}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="datetime-section">
                <div className="form-group">
                  <label>Date</label>
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input 
                    type="time" 
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                  />
                </div>
              </div>
              
              {selectedTemplate && (
                <div className="preview-section">
                  <h4>Preview</h4>
                  <div className="preview-message">
                    {selectedTemplate.message} I'm proposing {selectedDate || '[select date]'} at {selectedTime || '[select time]'}.
                  </div>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => setShowMeetingModal(false)}
              >
                Cancel
              </button>
              <button 
                className="send-button"
                onClick={sendMeetingRequest}
                disabled={!selectedTemplate || !selectedDate || !selectedTime}
              >
                Send Meeting Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;