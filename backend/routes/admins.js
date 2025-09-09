const express = require('express');
const router = express.Router();
const Event = require('../models/event');
const User = require('../models/user');
const Registration = require('../models/registration');
const { adminAuth } = require('../middleware/auth');
const mongoose = require('mongoose');

// Get admin dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalRegistrations = await Registration.countDocuments();
    
    // Calculate revenue (assuming $50 per registration for demo)
    const totalRevenue = totalRegistrations * 50;
    
    res.json({
      totalEvents,
      totalUsers,
      totalRegistrations,
      totalRevenue
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all events with details
router.get('/events', adminAuth, async (req, res) => {
  try {
    const events = await Event.find()
      .populate('createdBy', 'name email')
      .sort({ date: -1 });
    
    // Add registration counts for each event
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const registrationCount = await Registration.countDocuments({ 
          eventId: event._id 
        });
        
        return {
          ...event.toObject(),
          registered: registrationCount,
          revenue: registrationCount * 50 // Assuming $50 per registration
        };
      })
    );
    
    res.json(eventsWithStats);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new event
router.post('/events', adminAuth, async (req, res) => {
  try {
    const { title, description, date, time, location, capacity } = req.body;
    
    const event = new Event({
      title,
      description,
      date,
      time,
      location,
      capacity,
      createdBy: req.user.userId
    });
    
    await event.save();
    
    // Populate createdBy field for response
    await event.populate('createdBy', 'name email');
    
    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: errors.join(', ') });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// Update event (MISSING IN YOUR CODE)
router.put('/events/:eventId', adminAuth, async (req, res) => {
  try {
    console.log('Update event request received for event ID:', req.params.eventId);
    console.log('Update data:', req.body);
    
    const { eventId } = req.params;
    const { title, description, date, time, location, capacity } = req.body;
    
    // Validate eventId
    if (!eventId || eventId === 'undefined' || !mongoose.Types.ObjectId.isValid(eventId)) {
      console.log('Invalid event ID provided:', eventId);
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    
    const event = await Event.findByIdAndUpdate(
      eventId,
      {
        title,
        description,
        date,
        time,
        location,
        capacity
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');
    
    if (!event) {
      console.log('Event not found with ID:', eventId);
      return res.status(404).json({ message: 'Event not found' });
    }
    
    console.log('Event updated successfully:', event.title);
    
    // Add registration count for response
    const registrationCount = await Registration.countDocuments({ 
      eventId: event._id 
    });
    
    const eventWithStats = {
      ...event.toObject(),
      registered: registrationCount,
      revenue: registrationCount * 50
    };
    
    res.json(eventWithStats);
  } catch (error) {
    console.error('Error updating event:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: errors.join(', ') });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete event (MISSING IN YOUR CODE)
router.delete('/events/:eventId', adminAuth, async (req, res) => {
  try {
    console.log('Delete event request received for event ID:', req.params.eventId);
    
    const { eventId } = req.params;
    
    // Validate eventId
    if (!eventId || eventId === 'undefined' || !mongoose.Types.ObjectId.isValid(eventId)) {
      console.log('Invalid event ID provided:', eventId);
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      console.log('Event not found with ID:', eventId);
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Delete all registrations for this event first
    const deletedRegistrations = await Registration.deleteMany({ eventId: eventId });
    console.log(`Deleted ${deletedRegistrations.deletedCount} registrations for event`);
    
    // Delete the event
    await Event.findByIdAndDelete(eventId);
    
    console.log('Event deleted successfully:', event.title);
    res.json({ message: 'Event and all related registrations deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    // Get registration count for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const registrationCount = await Registration.countDocuments({ 
          userId: user._id 
        });
        
        return {
          ...user.toObject(),
          registrations: registrationCount
        };
      })
    );
    
    res.json(usersWithStats);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Make user admin
router.put('/users/:userId/make-admin', adminAuth, async (req, res) => {
  try {
    console.log('Make admin request received for user ID:', req.params.userId);
    console.log('Authenticated user:', req.user);
    
    const { userId } = req.params;
    
    // Validate userId
    if (!userId || userId === 'undefined' || !mongoose.Types.ObjectId.isValid(userId)) {
      console.log('Invalid user ID provided:', userId);
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { role: 'admin' },
      { new: true }
    ).select('-password');
    
    if (!user) {
      console.log('User not found with ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User role updated successfully:', user.email, 'is now admin');
    res.json({ message: 'User role updated to admin', user });
  } catch (error) {
    console.error('Error making user admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove admin role
router.put('/users/:userId/remove-admin', adminAuth, async (req, res) => {
  try {
    console.log('Remove admin request received for user ID:', req.params.userId);
    console.log('Authenticated user:', req.user);
    
    const { userId } = req.params;
    
    // Validate userId
    if (!userId || userId === 'undefined' || !mongoose.Types.ObjectId.isValid(userId)) {
      console.log('Invalid user ID provided:', userId);
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Prevent removing admin role from yourself (optional security measure)
    if (userId === req.user.userId) {
      return res.status(400).json({ message: 'Cannot remove admin role from yourself' });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { role: 'user' },
      { new: true }
    ).select('-password');
    
    if (!user) {
      console.log('User not found with ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('Admin role removed successfully from:', user.email);
    res.json({ message: 'Admin role removed', user });
  } catch (error) {
    console.error('Error removing admin role:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific event details (optional - for viewing event details)
router.get('/events/:eventId', adminAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    
    const event = await Event.findById(eventId)
      .populate('createdBy', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Get registrations for this event
    const registrations = await Registration.find({ eventId: eventId })
      .populate('userId', 'name email');
    
    const eventWithDetails = {
      ...event.toObject(),
      registrations: registrations,
      registered: registrations.length,
      revenue: registrations.length * 50
    };
    
    res.json(eventWithDetails);
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific user details (optional - for viewing user details)
router.get('/users/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user's registrations
    const registrations = await Registration.find({ userId: userId })
      .populate('eventId', 'title date location');
    
    const userWithDetails = {
      ...user.toObject(),
      registrations: registrations,
      registrationCount: registrations.length
    };
    
    res.json(userWithDetails);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;