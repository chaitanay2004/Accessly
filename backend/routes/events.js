const express = require('express');
const router = express.Router();
const Event = require('../models/event');
const Registration = require('../models/registration');
const { auth } = require('../middleware/auth');
const mongoose = require('mongoose');

// GET all events
router.get('/', async (req, res) => {
    try {
        console.log('Fetching all events');
        
        const events = await Event.find()
            .populate('createdBy', 'name email')
            .sort({ date: 1 });
        
        console.log(`Found ${events.length} events`);
        
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ 
            message: 'Server error while fetching events',
            error: error.message 
        });
    }
});

// GET single event by ID
router.get('/:id', async (req, res) => {
    try {
        const eventId = req.params.id;
        console.log('Fetching event with ID:', eventId);
        
        // Check if the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            console.log('Invalid event ID format:', eventId);
            return res.status(400).json({ 
                message: 'Invalid event ID format',
                receivedId: eventId
            });
        }
        
        const event = await Event.findById(eventId)
            .populate('createdBy', 'name email');
        
        if (!event) {
            console.log('Event not found with ID:', eventId);
            return res.status(404).json({ message: 'Event not found' });
        }
        
        console.log('Event found:', event.title);
        res.json(event);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ 
            message: 'Server error while fetching event',
            error: error.message 
        });
    }
});

// POST register for event - WITH AUTHENTICATION AND DEBUG LOGGING
router.post('/:id/register', auth, async (req, res) => {
    try {
        console.log('=== EVENT REGISTRATION REQUEST ===');
        console.log('Event ID:', req.params.id);
        console.log('User ID:', req.user.userId);
        console.log('Request body:', req.body);

        const eventId = req.params.id;
        
        // Validate event ID
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            console.log('Invalid event ID format:', eventId);
            return res.status(400).json({ message: 'Invalid event ID' });
        }
        
        const event = await Event.findById(eventId);
        
        if (!event) {
            console.log('Event not found with ID:', eventId);
            return res.status(404).json({ message: 'Event not found' });
        }
        
        console.log('Event found:', event.title);
        
        // Check if event is in the past
        if (new Date(event.date) < new Date()) {
            console.log('Event is in the past:', event.date);
            return res.status(400).json({ message: 'Cannot register for past events' });
        }
        
        // Check if user is already registered
        const existingRegistration = await Registration.findOne({
            userId: req.user.userId,
            eventId: eventId
        });
        
        if (existingRegistration) {
            console.log('User already registered for this event');
            return res.status(400).json({ message: 'Already registered for this event' });
        }
        
        // Check if event is full
        const registrationCount = await Registration.countDocuments({ 
            eventId: eventId 
        });
        
        console.log('Current registrations:', registrationCount, 'Capacity:', event.capacity);
        
        if (registrationCount >= event.capacity) {
            console.log('Event is full');
            return res.status(400).json({ message: 'Event is full' });
        }
        
        // Create registration
        const registration = new Registration({
            userId: req.user.userId,
            eventId: eventId
        });
        
        await registration.save();
        console.log('Registration saved successfully');
        
        // Update event registered count
        event.registered = registrationCount + 1;
        await event.save();
        console.log('Event registration count updated');
        
        res.json({ 
            message: 'Registration successful', 
            registration 
        });
        
    } catch (error) {
        console.error('Error registering for event:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            message: 'Server error',
            error: error.message 
        });
    }
});

module.exports = router;