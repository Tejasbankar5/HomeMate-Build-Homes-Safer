require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
      origin: "*", // Allow your frontend's URL
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
      credentials: true
    }
});

app.get('/chat', (req, res) => {
  res.send('Chat server is running');
});

// Handling real-time chat
io.on('connection', (socket) => {
    console.log('A user connected');
    
    // Listen for messages from the client
    socket.on('sendMessage', (message) => {
        console.log('Received message:', message);
        
        //Broadcast the message to all clients (send as an object)
        io.emit('newMessage', { sender: 'other', text: message }); // Send structured message
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

const PORT = process.env.PORT||8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

