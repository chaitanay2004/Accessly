const express = require('express');
const router = express.Router();

// Mock events data
const events = [
  {
    id: 1,
    title: 'Tech Conference 2023',
    description: 'Join us for the biggest technology conference of the year',
    date: '2023-06-15',
    time: '18:00',
    location: 'Convention Center',
    capacity: 500,
    registered: 247,
    image: 'tech-conference.jpg'
  },
  {
    id: 2,
    title: 'Academic Symposium',
    description: 'A gathering of academics and researchers',
    date: '2023-07-22',
    time: '10:00',
    location: 'University Hall',
    capacity: 300,
    registered: 189,
    image: 'academic-symposium.jpg'
  },
  {
    id: 3,
    title: 'Summer Music Festival',
    description: 'Enjoy a night of music and entertainment',
    date: '2023-08-05',
    time: '19:00',
    location: 'City Park',
    capacity: 1000,
    registered: 756,
    image: 'music-festival.jpg'
  }
];

// Get all events
router.get('/', (req, res) => {
  res.json(events);
});

// Get single event
router.get('/:id', (req, res) => {
  const event = events.find(e => e.id === parseInt(req.params.id));
  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }
  res.json(event);
});

// Register for event
router.post('/:id/register', (req, res) => {
  const event = events.find(e => e.id === parseInt(req.params.id));
  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }
  
  if (event.registered >= event.capacity) {
    return res.status(400).json({ message: 'Event is full' });
  }
  
  event.registered++;
  res.json({ message: 'Registration successful', event });
});

module.exports = router;