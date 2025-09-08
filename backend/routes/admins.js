const express = require('express');
const router = express.Router();

// Mock data for admin
const events = [
  {
    id: 1,
    title: 'Tech Conference 2023',
    date: '2023-06-15',
    registered: 247,
    capacity: 500,
    revenue: 12350
  },
  {
    id: 2,
    title: 'Academic Symposium',
    date: '2023-07-22',
    registered: 189,
    capacity: 300,
    revenue: 9450
  },
  {
    id: 3,
    title: 'Summer Music Festival',
    date: '2023-08-05',
    registered: 756,
    capacity: 1000,
    revenue: 37800
  }
];

const users = [
  { id: 1, name: 'John Doe', email: 'user@example.com', registrations: 2 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', registrations: 3 },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', registrations: 1 }
];

// Get admin dashboard stats
router.get('/stats', (req, res) => {
  const totalEvents = events.length;
  const totalUsers = users.length;
  const totalRegistrations = events.reduce((sum, event) => sum + event.registered, 0);
  const totalRevenue = events.reduce((sum, event) => sum + event.revenue, 0);
  
  res.json({
    totalEvents,
    totalUsers,
    totalRegistrations,
    totalRevenue
  });
});

// Get all events with details
router.get('/events', (req, res) => {
  res.json(events);
});

// Create new event
router.post('/events', (req, res) => {
  const { title, date, capacity } = req.body;
  const newEvent = {
    id: events.length + 1,
    title,
    date,
    registered: 0,
    capacity,
    revenue: 0
  };
  
  events.push(newEvent);
  res.status(201).json(newEvent);
});

// Get all users
router.get('/users', (req, res) => {
  res.json(users);
});

module.exports = router;