const express = require('express');
const router = express.Router();
const Event = require('../models/event');
const Registration = require('../models/registration');
const { auth } = require('../middleware/auth');

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find()
      .populate('createdBy', 'name email')
      .sort({ date: 1 });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register for event
router.post('/:id/register', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if event is in the past
    if (new Date(event.date) < new Date()) {
      return res.status(400).json({ message: 'Cannot register for past events' });
    }
    
    // Check if user is already registered
    const existingRegistration = await Registration.findOne({
      userId: req.user.userId,
      eventId: req.params.id
    });
    
    if (existingRegistration) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }
    
    // Check if event is full
    const registrationCount = await Registration.countDocuments({ 
      eventId: req.params.id 
    });
    
    if (registrationCount >= event.capacity) {
      return res.status(400).json({ message: 'Event is full' });
    }
    
    // Create registration
    const registration = new Registration({
      userId: req.user.userId,
      eventId: req.params.id
    });
    
    await registration.save();
    
    // Update event registered count
    event.registered = registrationCount + 1;
    await event.save();
    
    res.json({ 
      message: 'Registration successful', 
      registration 
    });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;