import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaPaperPlane, FaFile, FaImage, FaTimes, FaUser, FaClock, FaCheck, FaCheckDouble } from 'react-icons/fa';
import './Chat.css';

const Chat = ({ queryId, onClose }) => {
  const { user } = useAuth();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    if (queryId) {
      initializeChat();
      startPolling();
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [queryId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/chat/query/${queryId}`);
      setChat(response.data.chat);
      setParticipants(response.data.participants);
      await loadMessages(response.data.chat.id);
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const response = await axios.get(`/chat/${chatId}/messages`);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const startPolling = () => {
    // Poll for new messages every 3 seconds
    pollIntervalRef.current = setInterval(() => {
      if (chat?.id) {
        loadMessages(chat.id);
      }
    }, 3000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;
    if (!chat?.id) return;

    setSending(true);
    try {
      const formData = new FormData();
      formData.append('content', newMessage.trim() || 'File attachment');
      
      if (selectedFile) {
        formData.append('images', selectedFile);
        formData.append('message_type', selectedFile.type.startsWith('image/') ? 'image' : 'file');
      }

      const response = await axios.post(`/chat/${chat.id}/messages`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Add the new message to the list
      setMessages(prev => [...prev, response.data.message]);
      setNewMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderMessage = (message, index) => {
    const isOwnMessage = message.sender_id === user.id;
    const showDate = index === 0 || 
      formatDate(message.created_at) !== formatDate(messages[index - 1]?.created_at);

    return (
      <div key={message.id}>
        {showDate && (
          <div className="chat-date-separator">
            <span>{formatDate(message.created_at)}</span>
          </div>
        )}
        <div className={`chat-message ${isOwnMessage ? 'own-message' : 'other-message'}`}>
          {!isOwnMessage && (
            <div className="message-avatar">
              <FaUser />
            </div>
          )}
          <div className="message-content">
            {!isOwnMessage && (
              <div className="message-sender">
                {message.full_name || message.username}
                <span className="sender-role">({message.role})</span>
              </div>
            )}
            <div className="message-bubble">
              {message.message_type === 'image' && message.file_path && (
                <div className="message-image">
                  <img 
                    src={`${axios.defaults.baseURL.replace('/api', '')}/${message.file_path}`} 
                    alt="Shared image" 
                    onClick={() => window.open(`${axios.defaults.baseURL.replace('/api', '')}/${message.file_path}`, '_blank')}
                  />
                </div>
              )}
              {message.message_type === 'file' && message.file_path && (
                <div className="message-file">
                  <FaFile />
                  <a 
                    href={`${axios.defaults.baseURL.replace('/api', '')}/${message.file_path}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {message.file_name}
                  </a>
                </div>
              )}
              <div className="message-text">{message.content}</div>
            </div>
            <div className="message-time">
              <FaClock />
              {formatTime(message.created_at)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="chat-container">
        <div className="chat-loading">
          <div className="loading-spinner"></div>
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="chat-container">
        <div className="chat-error">
          <p>Unable to load chat. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-title">
          <h3>Query Discussion</h3>
          <span className={`chat-status ${chat.chat_status}`}>
            {chat.chat_status.charAt(0).toUpperCase() + chat.chat_status.slice(1)}
          </span>
        </div>
        <div className="chat-participants">
          {participants.map(participant => (
            <div key={participant.id} className="participant">
              <FaUser />
              <span>{participant.full_name || participant.username}</span>
              <span className="participant-role">({participant.role})</span>
            </div>
          ))}
        </div>
        {onClose && (
          <button className="chat-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => renderMessage(message, index))
        )}
        <div ref={messagesEndRef} />
      </div>

      {chat.chat_status !== 'closed' && (
        <div className="chat-input-container">
          {selectedFile && (
            <div className="selected-file">
              <div className="file-info">
                {selectedFile.type.startsWith('image/') ? <FaImage /> : <FaFile />}
                <span>{selectedFile.name}</span>
                <button onClick={removeSelectedFile}>
                  <FaTimes />
                </button>
              </div>
            </div>
          )}
          <form onSubmit={handleSendMessage} className="chat-input-form">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.txt"
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="file-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
            >
              <FaFile />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="message-input"
              disabled={sending}
            />
            <button
              type="submit"
              className="send-btn"
              disabled={sending || (!newMessage.trim() && !selectedFile)}
            >
              {sending ? (
                <div className="sending-spinner"></div>
              ) : (
                <FaPaperPlane />
              )}
            </button>
          </form>
        </div>
      )}

      {chat.chat_status === 'closed' && (
        <div className="chat-closed-notice">
          <p>This chat has been closed. No new messages can be sent.</p>
        </div>
      )}
    </div>
  );
};

export default Chat;