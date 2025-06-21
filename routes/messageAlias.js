const express = require('express');
const router = express.Router();

// Import the chat routes to use their handlers
const chatRoutes = require('./chat');

/**
 * Message Alias Routes
 * These routes provide compatibility aliases for frontend expectations
 * /api/messages/* -> /api/chats/*
 */

// Get conversations list (frontend expects: GET /api/messages/conversations)
router.get('/conversations', (req, res, next) => {
  // Redirect to the chat list endpoint
  req.url = '/';
  chatRoutes(req, res, next);
});

// Send message (frontend expects: POST /api/messages/:chatId)
router.post('/:chatId', (req, res, next) => {
  // Redirect to chat message send endpoint
  req.url = `/${req.params.chatId}/messages`;
  chatRoutes(req, res, next);
});

// Get message history (frontend expects: GET /api/messages/:chatId)
router.get('/:chatId', (req, res, next) => {
  // Redirect to chat message history endpoint
  req.url = `/${req.params.chatId}/messages`;
  chatRoutes(req, res, next);
});

// Mark message as read (frontend expects: POST /api/messages/:id/read)
router.post('/:id/read', (req, res, next) => {
  // Redirect to message read endpoint
  req.url = `/messages/${req.params.id}/read`;
  chatRoutes(req, res, next);
});

// Edit message (frontend expects: PATCH /api/messages/:id)
router.patch('/:id', (req, res, next) => {
  // Redirect to message edit endpoint
  req.url = `/messages/${req.params.id}`;
  chatRoutes(req, res, next);
});

// Delete message (frontend expects: DELETE /api/messages/:id)
router.delete('/:id', (req, res, next) => {
  // Redirect to message delete endpoint
  req.url = `/messages/${req.params.id}`;
  chatRoutes(req, res, next);
});

// WebSocket stream (frontend expects: GET /api/messages/:chatId/ws)
router.get('/:chatId/ws', (req, res, next) => {
  // Redirect to SSE stream endpoint (will be upgraded to WebSocket later)
  req.url = `/${req.params.chatId}/stream`;
  chatRoutes(req, res, next);
});

// Search in specific chat (frontend expects: GET /api/messages/:chatId/search)
router.get('/:chatId/search', (req, res, next) => {
  req.url = `/${req.params.chatId}/search`;
  chatRoutes(req, res, next);
});

// Global message search (frontend expects: GET /api/messages/search)
router.get('/search', (req, res, next) => {
  req.url = '/search';
  chatRoutes(req, res, next);
});

// Unread count (frontend expects: GET /api/messages/unread-count)
router.get('/unread-count', (req, res, next) => {
  req.url = '/unread-count';
  chatRoutes(req, res, next);
});

// Bulk mark as read (frontend expects: POST /api/messages/mark-read)
router.post('/mark-read', (req, res, next) => {
  req.url = '/messages/read';
  chatRoutes(req, res, next);
});

// Mark specific chat as read (frontend expects: POST /api/messages/:chatId/mark-read)
router.post('/:chatId/mark-read', (req, res, next) => {
  req.url = `/${req.params.chatId}/mark-read`;
  chatRoutes(req, res, next);
});

module.exports = router;