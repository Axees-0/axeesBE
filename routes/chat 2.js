const { Types } = require('mongoose');
const ChatRoom = require('../models/ChatRoom');
const Message  = require('../models/Message');
const { isMessageAllowed } = require('../utils/contentFilter');
const { Router } = require('express');
const { sendUnreadMessageNotification } = require('../services/notificationService');
const User = require('../models/User');
const offer = require('../models/offer');

const router = Router();

/** helper — get caller’s id without auth middleware */
function getCallerId(req) {
  return (
    req.get('x-user-id') ||        // preferred: header
    req.body.userId    ||          // POST / PATCH
    req.query.userId              // GET
  );
}

function toObjectId(id, fieldName, res) {
  if (!id || !Types.ObjectId.isValid(id)) {
    res.status(400).send(`${fieldName} is missing or invalid ${id}`);
    return null;
  }
  return new Types.ObjectId(id);
}

/* ------------------------------------------------------------------ */
/* In‑memory SSE clients store for broadcasting messages              */
/* ------------------------------------------------------------------ */
const sseClients = {};

/* ------------------------------------------------------------------ */
/* LIST my rooms                                                      */
/* ------------------------------------------------------------------ */
router.get('/', async (req, res) => {
  const myId = toObjectId(getCallerId(req), 'userId', res);
  if (!myId) return;

  const rooms = await ChatRoom.find({ participants: myId })
    .sort({ updatedAt: -1 })
    .populate('participants', 'name avatarUrl userName')
    .populate({
      path: 'createdFromOffer',
      select: 'description notes offerType offerName status', // Add the fields you want
    })
    .lean();

  // Format the response to include peer info
  const formattedRooms = rooms.map(room => {
    const peer = room.participants.find(p => p._id.toString() !== myId.toString());
    return {
      ...room,
      peerId: peer?._id,
      peerName: peer?.name || peer?.userName,
      peerAvatar: peer?.avatarUrl,
    };
  });

  res.json(formattedRooms);
});

/* ------------------------------------------------------------------ */
/* CREATE / fetch 1‑1 room                                            */
/* ------------------------------------------------------------------ */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/attachments');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});


const upload = multer({ storage });

router.post('/:chatId/messages', upload.array('attachments'), async (req, res) => {
  const meId = toObjectId(getCallerId(req), 'userId', res);
  if (!meId) return;

  const { text, receiverId } = req.body;
  
  // Validate receiverId exists and is valid
  const peerId = toObjectId(receiverId, 'receiverId', res);
  if (!peerId) return;

  // Verify the receiver is a participant in this chat
  const chat = await ChatRoom.findOne({
    _id: req.params.chatId,
    participants: { $all: [meId, peerId] }
  });
  
  if (!chat) {
    return res.status(403).send('You are not authorized to send messages in this chat');
  }

  let attachments = [];

  // Process uploaded files
  if (req.files && req.files.length > 0) {
    attachments = req.files.map(file => ({
      url: `/uploads/attachments/${file.filename}`,
      type: file.mimetype,
      name: file.originalname,
      size: file.size
    }));
  }

  // Validate message content
  if (!text && !attachments.length) return res.status(400).send('Empty message');
  if (text && !isMessageAllowed(text)) return res.status(400).send('Forbidden text');

  // Create the message document
  const msg = await Message.create({
    chatId: chat._id,
    senderId: meId,
    text,
    attachments,
  });

  // Update the chat room
  await ChatRoom.findByIdAndUpdate(chat._id, {
    $set: { 
      lastMessage: { 
        text: text || 'Attachment', 
        sender: meId, 
        createdAt: msg.createdAt 
      } 
    },
    $inc: { 
      [`unreadCount.${peerId}`]: 1 
    },
  });

  // Broadcast the new message
  if (sseClients[chat._id]) {
    sseClients[chat._id].forEach(clientRes => {
      clientRes.write(`data: ${JSON.stringify(msg)}\n\n`);
    });
  }

  // Schedule notification
  checkAndSendNotification(msg, peerId);

  res.json(msg);
});

/** Paginated history */
router.get('/:chatId/messages', async (req, res) => {
  const me = getCallerId(req);
  if (!me) return res.status(400).send('userId missing');

  const { cursor, limit = 30 } = req.query;
  const query = { chatId: req.params.chatId };
  
  if (cursor) {
    query.createdAt = { $lt: new Date(cursor) };
  }

  const msgs = await Message.find(query)
    .populate({
      path: 'senderId',
      select: 'name avatarUrl userName',
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

  res.json(msgs);
});


<<<<<<< HEAD
/** Send message */
// In your message creation route:
router.post('/:chatId/messages', async (req, res) => {
  const meId = toObjectId(getCallerId(req), 'userId', res);
  if (!meId) return;
  console.log("usd")

  const { text, attachments, receiverId } = req.body;
  if (!text && !attachments?.length) return res.status(400).send('Empty');
  if (text && !isMessageAllowed(text))   return res.status(400).send('Forbidden text');

  // Create the message document
  const msg = await Message.create({
    chatId: new Types.ObjectId(req.params.chatId),
    senderId: meId,
    text,
    attachments,
  });

  // Update the chat room with the last message and increase the unread count for the receiver.
  await ChatRoom.findByIdAndUpdate(req.params.chatId, {
    $set : { lastMessage: { text, sender: meId, createdAt: msg.createdAt } },
    $inc: { [`unreadCount.${receiverId}`]: 1 },
  });

  // Broadcast the new message to all connected SSE clients for this chat room.
  if (sseClients[req.params.chatId]) {
    sseClients[req.params.chatId].forEach(clientRes => {
      clientRes.write(`data: ${JSON.stringify(msg)}\n\n`);
    });
  }

  // Schedule notification check after 2 minutes - DON'T AWAIT THIS
  checkAndSendNotification(msg, receiverId); // Removed the await

  res.json(msg);
});
=======
>>>>>>> feature/testing-infrastructure

// Notification checker function
const checkAndSendNotification = async (msg, receiverId) => {
  // Wait 2 minutes (120000ms) - using 1000ms for testing
  console.log("Scheduling notification check for message:", msg._id); // Fixed typo
  
  setTimeout(async () => {
    try {
      console.log("Checking if message is still unread:", msg._id);
      
      // Check if message is still unread
      const chatRoom = await ChatRoom.findById(msg.chatId);
      
      if (chatRoom && chatRoom.unreadCount.get(receiverId.toString()) > 0) {
        console.log("Message is still unread, sending notification");
        
        // Message is still unread
        const receiver = await User.findById(receiverId);
        const sender = await User.findById(msg.senderId);
        
        if (!receiver) {
          console.log('Receiver not found');
          return;
        }

        // Get populated message for notification
        const populatedMsg = await Message.findById(msg._id)
          .populate('senderId', 'name');
        
        if (populatedMsg) {
          await sendUnreadMessageNotification(
            receiver,
            populatedMsg,
            { chatId: msg.chatId }
          );
          
          console.log("Notification sent successfully");
          
          // Optional: Mark that notification was sent to avoid duplicates
          await ChatRoom.findByIdAndUpdate(msg.chatId, {
            $set: { [`notificationSent.${receiverId}`]: true }
          });
        }
      } else {
        console.log("Message has been read, no notification needed");
      }
    } catch (error) {
      console.error('Error in notification check:', error);
    }
  }, 120000); // 2 minutes in milliseconds (use 1000 for testing)
};


/** Mark read */
router.post('/messages/:id/read', async (req, res) => {
  const me = getCallerId(req);
  if (!me) return res.status(400).send('userId missing');

  const msg = await Message.findByIdAndUpdate(
    req.params.id,
    { status: 'read' },
    { new: true }
  );
  await ChatRoom.findByIdAndUpdate(msg.chatId, {
    $set: { [`unreadCount.${me}`]: 0 },
  });
  res.json(msg);
});

/** Edit / delete keep the same getCallerId() check */
router.patch('/messages/:id', async (req, res) => {
  const me = getCallerId(req);
  if (!me) return res.status(400).send('userId missing');

  const msg = await Message.findById(req.params.id);
  if (!msg.senderId.equals(me)) return res.status(403).end();
  if (msg.deleted) return res.status(400).send('deleted');

  msg.text = req.body.text;
  msg.edited = true;
  await msg.save();
  res.json(msg);
});

router.delete('/messages/:id', async (req, res) => {
  const me = getCallerId(req);
  if (!me) return res.status(400).send('userId missing');

  const msg = await Message.findById(req.params.id);
  if (!msg.senderId.equals(me)) return res.status(403).end();

  msg.deleted = true;
  msg.text = '';
  await msg.save();
  res.json(msg);
});

/** SSE stream endpoint */
// In your chat.js, update the SSE endpoint
// Update your SSE endpoint in chat.js
router.get('/:chatId/stream', async (req, res) => {
  const chatId = req.params.chatId;
  const userId = req.query.userId; // From query params

  if (!userId) {
    console.log('SSE rejected - missing userId');
    return res.status(401).end();
  }

  // Verify chat access
  const hasAccess = await ChatRoom.exists({
    _id: chatId,
    participants: userId
  });
  
  if (!hasAccess) return res.status(403).end();

  // SSE Setup
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  // Send initial message
  res.write('event: connected\ndata: {"status":"ok"}\n\n');

  // Add client to connections
  if (!sseClients[chatId]) sseClients[chatId] = new Set();
  sseClients[chatId].add(res);

  // Heartbeat
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  // Cleanup on close
  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients[chatId]?.delete(res);
    console.log(`SSE closed for ${chatId}`);
  });
});

router.get('/:chatId/search', async (req, res) => {
  const me = getCallerId(req);
  if (!me) return res.status(400).send('userId missing');

  const { query } = req.query;
  if (!query) return res.status(400).send('Search query missing');

  const msgs = await Message.find({
    chatId: req.params.chatId,
    text: { $regex: query, $options: 'i' },
    deleted: { $ne: true }
  })
    .populate({
      path: 'senderId',
      select: 'name avatarUrl userName',
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  res.json(msgs);
});

router.get('/search', async (req, res) => {
  const { query, userId } = req.query;
  const myId = toObjectId(userId, 'userId', res);
  if (!myId) return;

  try {
    // First find all chats for this user
    const rooms = await ChatRoom.find({ participants: myId })
      .populate('participants', 'name avatarUrl userName')
      .populate({
        path: 'createdFromOffer',
        select: 'description notes offerType offerName status',
      })
      .lean();

    // Filter in memory for better search flexibility
    const filteredRooms = rooms.filter(room => {
      const peer = room.participants.find(p => p._id.toString() !== myId.toString());
      const peerName = peer?.name || peer?.userName || '';
      const offerName = room.createdFromOffer?.offerName || '';
      const offerType = room.createdFromOffer?.offerType || '';

      // Case-insensitive search across multiple fields
      const searchRegex = new RegExp(query, 'i');
      return (
        searchRegex.test(peerName) ||
        searchRegex.test(offerName) ||
        searchRegex.test(offerType)
      );
    });

    // Format the response to match your existing structure
    const formattedRooms = filteredRooms.map(room => {
      const peer = room.participants.find(p => p._id.toString() !== myId.toString());
      return {
        ...room,
        peerId: peer?._id,
        peerName: peer?.name || peer?.userName,
        peerAvatar: peer?.avatarUrl,
        offerName: room.createdFromOffer?.offerName,
        offerType: room.createdFromOffer?.offerType,
        offerDescription: room.createdFromOffer?.description,
        offerNotes: room.createdFromOffer?.notes,
        offerStatus: room.createdFromOffer?.status,
      };
    });

    res.json(formattedRooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/unread-count', async (req, res) => {
  const userId = toObjectId(getCallerId(req), 'userId', res);
  if (!userId) return;

  const rooms = await ChatRoom.find({ participants: userId });
  
  let totalUnread = 0;
  rooms.forEach(room => {
    totalUnread += room.unreadCount.get(userId.toString()) || 0;
  });

  res.json({ totalUnread });
});

// Mark messages as read
router.post('/messages/read', async (req, res) => {
  const { chatId, userId } = req.body;
  
  await ChatRoom.findByIdAndUpdate(chatId, {
    $set: { [`unreadCount.${userId}`]: 0 },
  });

  res.json({ success: true });
});

router.post('/:chatId/mark-read', async (req, res) => {
  const { userId } = req.body;
  const { chatId } = req.params;
  
  await ChatRoom.findByIdAndUpdate(chatId, {
    $set: { [`unreadCount.${userId}`]: 0 },
  });

  res.json({ success: true });
});





module.exports = router;
