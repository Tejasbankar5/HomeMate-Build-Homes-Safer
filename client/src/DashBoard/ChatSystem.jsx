import React, { useState, useEffect, useRef } from 'react';
import './chat.css';

const users = [
  { id: 1, name: 'Rajesh Bankar', avatar: 'RB', color: '#4e79a7' },
  { id: 2, name: 'Shreyash Meshram', avatar: 'SM', color: '#f28e2b' },
  { id: 3, name: 'Ankit Verma', avatar: 'AV', color: '#e15759' },
];

const meetingTypes = [
  { id: 'online', label: 'Online Meeting', icon: '💻' },
  { id: 'offline', label: 'Offline Meeting', icon: '🏢' },
  { id: 'field', label: 'Field Visit', icon: '🌄' },
];

const timeSlots = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', 
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', 
  '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'
];

const initialMessages = [
  {
    id: 1,
    sender: 2,
    text: 'Hey Client , let\'s schedule our weekly sync',
    timestamp: '10:30 AM',
    isMeeting: false
  },
  {
    id: 2,
    sender: 1,
    text: 'Sure, how about tomorrow at 10 AM?',
    timestamp: '10:32 AM',
    isMeeting: false
  },
  {
    id: 3,
    sender: 3,
    text: 'Meeting scheduled: Project Review (Online) at 10:00 AM tomorrow',
    timestamp: '10:35 AM',
    isMeeting: true,
    meetingDetails: {
      type: 'online',
      time: '10:00 AM',
      date: 'Tomorrow',
      participants: [1, 2, 3]
    }
  }
];

function ChatSystem() {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(users[0]);
  const [showScheduler, setShowScheduler] = useState(false);
  const [meetingDetails, setMeetingDetails] = useState({
    type: 'online',
    time: '10:00 AM',
    date: '',
    agenda: ''
  });
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: messages.length + 1,
      sender: selectedUser.id,
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMeeting: false
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  const handleScheduleMeeting = () => {
    if (!meetingDetails.date) return;

    const meetingMessage = {
      id: messages.length + 1,
      sender: selectedUser.id,
      text: `Meeting scheduled: ${meetingDetails.agenda || 'MileStone Meeting'} (${meetingTypes.find(m => m.id === meetingDetails.type).label}) at ${meetingDetails.time} on ${meetingDetails.date}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMeeting: true,
      meetingDetails: {
        ...meetingDetails,
        participants: users.map(u => u.id)
      }
    };

    setMessages([...messages, meetingMessage]);
    setMeetingDetails({
      type: 'online',
      time: '10:00 AM',
      date: '',
      agenda: ''
    });
    setShowScheduler(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="app-container">
      <div className="chat-container">
        <div className="user-list">
          <h2>Team Members</h2>
          {users.map(user => (
            <div 
              key={user.id}
              className={`user-item ${selectedUser.id === user.id ? 'active' : ''}`}
              onClick={() => setSelectedUser(user)}
            >
              <div className="user-avatar" style={{ backgroundColor: user.color }}>
                {user.avatar}
              </div>
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-status">Online</div>
              </div>
            </div>
          ))}
        </div>

        <div className="chat-area">
          <div className="chat-header">
            <h2>Team Chat</h2>
            <button 
              className="schedule-button"
              onClick={() => setShowScheduler(!showScheduler)}
            >
              {showScheduler ? 'Close Scheduler' : 'Schedule Meeting'}
            </button>
          </div>

          {showScheduler && (
            <div className="scheduler-panel">
              <h3>Schedule New Meeting</h3>
              <div className="form-group">
                <label>Meeting Type</label>
                <div className="meeting-type-options">
                  {meetingTypes.map(type => (
                    <div 
                      key={type.id}
                      className={`meeting-type ${meetingDetails.type === type.id ? 'selected' : ''}`}
                      onClick={() => setMeetingDetails({...meetingDetails, type: type.id})}
                    >
                      <span className="meeting-icon">{type.icon}</span>
                      {type.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Date</label>
                <input 
                  type="date" 
                  value={meetingDetails.date}
                  onChange={(e) => setMeetingDetails({...meetingDetails, date: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Time</label>
                <select
                  value={meetingDetails.time}
                  onChange={(e) => setMeetingDetails({...meetingDetails, time: e.target.value})}
                >
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Agenda (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Meeting agenda..."
                  value={meetingDetails.agenda}
                  onChange={(e) => setMeetingDetails({...meetingDetails, agenda: e.target.value})}
                />
              </div>

              <button 
                className="send-button"
                onClick={handleScheduleMeeting}
                disabled={!meetingDetails.date}
              >
                Schedule Meeting
              </button>
            </div>
          )}

          <div className="messages-container">
            {messages.map((message) => {
              const sender = users.find(u => u.id === message.sender);
              return (
                <div 
                  key={message.id}
                  className={`message ${message.sender === selectedUser.id ? 'sent' : 'received'} ${message.isMeeting ? 'meeting' : ''}`}
                >
                  {message.sender !== selectedUser.id && (
                    <div className="message-avatar" style={{ backgroundColor: sender.color }}>
                      {sender.avatar}
                    </div>
                  )}
                  <div className="message-content">
                    {message.sender !== selectedUser.id && (
                      <div className="message-sender">{sender.name}</div>
                    )}
                    <div className="message-text">{message.text}</div>
                    {message.isMeeting && message.meetingDetails && (
                      <div className="meeting-details">
                        <div className="meeting-type-badge">
                          {meetingTypes.find(m => m.id === message.meetingDetails.type).icon}
                          {meetingTypes.find(m => m.id === message.meetingDetails.type).label}
                        </div>
                        <div className="meeting-time">
                          🕒 {message.meetingDetails.time} on {message.meetingDetails.date}
                        </div>
                      </div>
                    )}
                    <div className="message-time">{message.timestamp}</div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="message-input-container">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              rows="1"
            />
            <button 
              className="send-button"
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatSystem;