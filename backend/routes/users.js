const express = require('express');
const router = express.Router();
const qr = require('qr-image');

// Mock user registrations
const registrations = [
  { id: 1, userId: 1, eventId: 1, date: '2023-05-10' },
  { id: 2, userId: 1, eventId: 2, date: '2023-05-15' }
];

// Get user profile
router.get('/profile', (req, res) => {
  // In a real app, get user from database based on token
  const user = {
    id: 1,
    name: 'John Doe',
    email: 'user@example.com',
    role: 'user'
  };
  res.json(user);
});

// Get user registrations
router.get('/registrations', (req, res) => {
  const userRegistrations = registrations.filter(r => r.userId === 1); // In real app, get from token
  res.json(userRegistrations);
});

// Generate QR code for event ticket
router.get('/ticket/:eventId/qrcode', (req, res) => {
  const eventId = req.params.eventId;
  const ticketData = `ACCESSLY:TICKET|USER:1|EVENT:${eventId}|DATE:${new Date().toISOString()}`;
  
  try {
    const qr_png = qr.image(ticketData, { type: 'png' });
    res.setHeader('Content-type', 'image/png');
    qr_png.pipe(res);
  } catch (error) {
    res.status(500).json({ message: 'Error generating QR code' });
  }
});

module.exports = router;