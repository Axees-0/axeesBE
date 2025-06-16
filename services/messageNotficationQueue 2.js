// services/notificationQueue.js
const Queue = require('bull');
const { sendUnreadMessageNotification } = require('./notificationService');
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');
const User = require('../models/User');

const notificationQueue = new Queue('message notifications', {
  redis: process.env.REDIS_URL
});

// Process jobs
notificationQueue.process(async (job) => {
  const { messageId, receiverId } = job.data;
  
  const message = await Message.findById(messageId)
    .populate('senderId', 'name');
  const chatRoom = await ChatRoom.findById(message.chatId);
  
  if (chatRoom.unreadCount.get(receiverId.toString())) {
    const receiver = await User.findById(receiverId);
    await sendUnreadMessageNotification(
      receiver,
      message,
      { chatId: message.chatId }
    );
  }
});

// Function to add a notification check to the queue
async function scheduleNotificationCheck(messageId, receiverId) {
  await notificationQueue.add(
    { messageId, receiverId },
    { delay: 12000 } // 2 minutes delay
  );
}

module.exports = { scheduleNotificationCheck };