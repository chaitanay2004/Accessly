const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Event = require('../models/event');
const Registration = require('../models/registration');
const { auth } = require('../middleware/auth');
const { generateQR, generateTicketData } = require('../utils/qrGenerator');
const QRCode = require('qr-image');

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user registrations
router.get('/registrations', auth, async (req, res) => {
  try {
    const registrations = await Registration.find({ userId: req.user.userId })
      .populate('eventId', 'title date time location')
      .sort({ registrationDate: -1 });
    
    res.json(registrations);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate QR code for event ticket
router.get('/ticket/:eventId/qrcode', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Check if user is registered for this event
    const registration = await Registration.findOne({
      userId: req.user.userId,
      eventId: eventId
    });
    
    if (!registration) {
      return res.status(404).json({ message: 'No ticket found for this event' });
    }
    
    const ticketData = generateTicketData(req.user.userId, eventId);
    
    try {
      const qr_png = QRCode.image(ticketData, { type: 'png' });
      res.setHeader('Content-type', 'image/png');
      qr_png.pipe(res);
    } catch (error) {
      res.status(500).json({ message: 'Error generating QR code' });
    }
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;