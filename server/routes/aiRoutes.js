const express = require('express');
const router = express.Router();
const { handleChat } = require('../controllers/aiController');

// POST /api/ai/chat
router.post('/chat', handleChat);

module.exports = router;
