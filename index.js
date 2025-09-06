const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const Message = require('./models/message');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB...', err));

const clients = new Map();

wss.on('connection', (ws, req) => {
  const userId = req.url.substring(1); // যেমন ws://localhost:3000/user123
  if (userId) {
    clients.set(userId, ws);
    console.log(`User ${userId} connected.`);
  }

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      // ✅ যদি মেসেজে groupName থাকে, প্রথমবারেই পুরোনো মেসেজ পাঠিয়ে দেবে
      if (data.groupName && !data.content) {
        const oldMessages = await Message.find({ groupName: data.groupName }).sort({ timestamp: 1 });

        ws.send(JSON.stringify({
          type: 'oldMessages',
          groupName: data.groupName,
          messages: oldMessages
        }));
        return;
      }

      // ✅ নতুন মেসেজ সেভ + ব্রডকাস্ট
      if (data.content) {
        const newMessage = new Message({
          senderId: userId,
          receiverId: data.receiverId,
          groupName: data.groupName,
          content: data.content,
        });
        await newMessage.save();

        // প্রাইভেট চ্যাট
        if (data.receiverId) {
          const receiverWs = clients.get(data.receiverId);
          if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
            receiverWs.send(JSON.stringify(newMessage));
          }
          ws.send(JSON.stringify(newMessage));
        }
        // গ্রুপ চ্যাট
        else if (data.groupName) {
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(newMessage));
            }
          });
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  ws.on('close', () => {
    clients.delete(userId);
    console.log(`User ${userId} disconnected.`);
  });
});

// Server start
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
