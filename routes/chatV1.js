const { Types } = require('mongoose');
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const { isMessageAllowed } = require('../utils/contentFilter');
const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = Router();

// Helper function to get caller's ID
function getCallerId(req) {
  return (
    req.get('x-user-id') ||
    req.body.userId ||
    req.query.userId
  );
}

// Helper function to validate ObjectId
function toObjectId(id, fieldName, res) {
  if (!id || !Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: `${fieldName} is missing or invalid: ${id}` });
    return null;
  }
  return new Types.ObjectId(id);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/attachments');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

/* ------------------------------------------------------------------ */
/* POST /api/v1/chat/send - Send Message                             */
/* ------------------------------------------------------------------ */
router.post('/send', upload.array('attachments', 5), async (req, res) => {
  try {
    const senderId = toObjectId(getCallerId(req), 'senderId', res);
    if (!senderId) return;

    const { text, receiverId, roomId } = req.body;
    
    // Validate required fields
    if (!roomId) {
      return res.status(400).json({ error: 'Room ID is required' });
    }
    
    // Validate receiverId exists and is valid
    const recipientId = toObjectId(receiverId, 'receiverId', res);
    if (!recipientId) return;

    // Verify the chat room exists and both users are participants
    const chatRoom = await ChatRoom.findOne({
      _id: roomId,
      participants: { $all: [senderId, recipientId] }
    });
    
    if (!chatRoom) {
      return res.status(403).json({ 
        error: 'You are not authorized to send messages in this chat room' 
      });
    }

    // Process attachments
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        url: `/uploads/attachments/${file.filename}`,
        type: file.mimetype,
        name: file.originalname,
        size: file.size
      }));
    }

    // Validate message content
    if (!text && !attachments.length) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }
    
    if (text) {
      // Check text length
      if (text.length > 5000) {
        return res.status(400).json({ error: 'Message text is too long (max 5000 characters)' });
      }
      
      // Check for inappropriate content
      if (!isMessageAllowed(text)) {
        return res.status(400).json({ error: 'Message contains inappropriate content' });
      }
    }

    // Create the message document
    const message = await Message.create({
      chatId: chatRoom._id,
      senderId: senderId,
      text: text || '',
      attachments: attachments,
    });

    // Update the chat room
    await ChatRoom.findByIdAndUpdate(chatRoom._id, {
      $set: { 
        lastMessage: { 
          text: text || 'Attachment', 
          sender: senderId, 
          createdAt: message.createdAt 
        } 
      },
      $inc: { 
        [`unreadCount.${recipientId}`]: 1 
      },
    });

    // Populate sender information for response
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name userName avatarUrl')
      .lean();

    res.status(201).json({
      success: true,
      message: populatedMessage
    });

  } catch (error) {
    console.error('Error sending message:', error);
    
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large (max 10MB)' });
      }
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Too many files (max 5)' });
      }
    }
    
    if (error.message.includes('File type') && error.message.includes('not allowed')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/* ------------------------------------------------------------------ */
/* GET /api/v1/chat/messages/:roomId - Get Messages                  */
/* ------------------------------------------------------------------ */
router.get('/messages/:roomId', async (req, res) => {
  try {
    const userId = getCallerId(req);
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const { roomId } = req.params;
    const { cursor, limit = 30 } = req.query;

    // Validate room ID
    const roomObjectId = toObjectId(roomId, 'roomId', res);
    if (!roomObjectId) return;

    // Verify user has access to this chat room
    const chatRoom = await ChatRoom.findOne({
      _id: roomObjectId,
      participants: userId
    });

    if (!chatRoom) {
      return res.status(403).json({ 
        error: 'You are not authorized to access messages in this chat room' 
      });
    }

    // Build query for pagination
    const query = { 
      chatId: roomObjectId,
      deleted: { $ne: true } // Exclude deleted messages
    };
    
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    // Fetch messages with pagination
    const messages = await Message.find(query)
      .populate('senderId', 'name userName avatarUrl')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) + 1) // Fetch one extra to check if there are more
      .lean();

    // Check if there are more messages
    const hasMore = messages.length > parseInt(limit);
    if (hasMore) {
      messages.pop(); // Remove the extra message
    }

    // Get the next cursor (createdAt of the last message)
    const nextCursor = messages.length > 0 ? messages[messages.length - 1].createdAt : null;

    res.json({
      success: true,
      messages: messages,
      hasMore: hasMore,
      nextCursor: nextCursor,
      pagination: {
        limit: parseInt(limit),
        hasMore: hasMore,
        cursor: nextCursor
      }
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/* ------------------------------------------------------------------ */
/* GET /api/v1/chat/stream/:roomId - Real-time SSE connection        */
/* ------------------------------------------------------------------ */
const sseClients = {};

router.get('/stream/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.query.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    // Validate room access
    const hasAccess = await ChatRoom.exists({
      _id: roomId,
      participants: userId
    });
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this chat room' });
    }

    // Set up SSE headers
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection message
    res.write('event: connected\ndata: {"status":"connected","timestamp":"' + new Date().toISOString() + '"}\n\n');

    // Add client to connections
    if (!sseClients[roomId]) sseClients[roomId] = new Set();
    sseClients[roomId].add(res);

    // Send heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch (error) {
        clearInterval(heartbeat);
      }
    }, 30000);

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(heartbeat);
      if (sseClients[roomId]) {
        sseClients[roomId].delete(res);
        if (sseClients[roomId].size === 0) {
          delete sseClients[roomId];
        }
      }
    });

    req.on('error', () => {
      clearInterval(heartbeat);
      if (sseClients[roomId]) {
        sseClients[roomId].delete(res);
      }
    });

  } catch (error) {
    console.error('Error setting up SSE connection:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Export SSE clients for use in message broadcasting
router.sseClients = sseClients;

module.exports = router;