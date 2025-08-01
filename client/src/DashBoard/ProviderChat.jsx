// ServiceProviderChatSystem.jsx
import React, { useState, useEffect } from "react";
import "./ichat.css";
import io from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:5000");

const ServiceProviderChatSystem = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    fetchConversations();

    socket.on("new_message", (data) => {
      if (selectedClient && data.client_id === selectedClient.id) {
        fetchMessages(selectedClient.conversation_id);
      }
      fetchConversations();
    });

    return () => socket.off("new_message");
  }, [selectedClient]);

  const fetchConversations = async () => {
    try {
      const res = await axios.get("/service-provider/getConversations");
      setConversations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (conversation) => {
    try {
      const res = await axios.get(`/service-provider/getMessages/${conversation.conversation_id}`);
      setMessages(res.data.messages);
      setSelectedClient(conversation);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async () => {
    if (newMessage.trim() === "") return;
    try {
      await axios.post("/service-provider/sendMessage", {
        conversation_id: selectedClient.conversation_id,
        message_text: newMessage,
      });
      setNewMessage("");
      fetchMessages(selectedClient);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="chat-container">
      <div className="sidebar">
        <h2>Clients</h2>
        {conversations.map((conversation) => (
          <div
            key={conversation.conversation_id}
            className={`conversation ${selectedClient && selectedClient.id === conversation.client_id ? "active" : ""}`}
            onClick={() => fetchMessages(conversation)}
          >
            {conversation.client_email}
          </div>
        ))}
      </div>
      <div className="chat-section">
        {selectedClient ? (
          <>
            <div className="messages">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${msg.sender_type === "service_provider" ? "sent" : "received"}`}
                >
                  {msg.message_text}
                </div>
              ))}
            </div>
            <div className="message-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <div className="no-client-selected">Select a client to start chatting</div>
        )}
      </div>
    </div>
  );
};

export default ServiceProviderChatSystem;
