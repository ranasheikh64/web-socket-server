// models/message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: String, // Flutter app থেকে ব্যবহারকারীর আইডি
    required: true,
  },
  receiverId: {
    type: String, // এটি প্রাইভেট চ্যাটের জন্য ব্যবহার হবে। গ্রুপ চ্যাটের জন্য groupName
    required: false,
  },
  groupName: {
    type: String, // গ্রুপ চ্যাটের জন্য
    required: false,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;