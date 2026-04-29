const express = require('express');
const router = express.Router();

// Scaffolded Patients Routes
router.get('/', (req, res) => {
  res.status(501).json({ message: 'Patients fetch route not yet implemented' });
});

router.post('/', (req, res) => {
  res.status(501).json({ message: 'Patient creation route not yet implemented' });
});

module.exports = router;
