const qr = require('qr-image');

// Generate QR code
const generateQR = (text) => {
  try {
    return qr.imageSync(text, { type: 'png' });
  } catch (error) {
    throw new Error('QR generation failed');
  }
};

// Generate ticket data string
const generateTicketData = (userId, eventId) => {
  return `ACCESSLY:TICKET|USER:${userId}|EVENT:${eventId}|DATE:${new Date().toISOString()}`;
};

module.exports = { generateQR, generateTicketData };