const express = require('express');
const router = express.Router();

// Scaffolded Auth Routes
router.post('/register', (req, res) => {
  res.status(501).json({ message: 'Register route not yet implemented' });
});

router.post('/login', (req, res) => {
  res.status(501).json({ message: 'Login route not yet implemented' });
});

module.exports = router;
