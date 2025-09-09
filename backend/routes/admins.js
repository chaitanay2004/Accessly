const express = require('express');
const router = express.Router();
const Event = require('../models/event');
const User = require('../models/user');
const Registration = require('../models/registration');
const { adminAuth } = require('../middleware/auth');

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
    
    res.json(events);
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
        const { userId } = req.params;
        
        // Validate userId
        if (!userId || userId === 'undefined' || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        
        const user = await User.findByIdAndUpdate(
            userId,
            { role: 'admin' },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ message: 'User role updated to admin', user });
    } catch (error) {
        console.error('Error making user admin:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Remove admin role
router.put('/users/:userId/remove-admin', adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Validate userId
        if (!userId || userId === 'undefined' || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        
        const user = await User.findByIdAndUpdate(
            userId,
            { role: 'user' },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ message: 'Admin role removed', user });
    } catch (error) {
        console.error('Error removing admin role:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;