document.addEventListener('DOMContentLoaded', function() {
    console.log('User dashboard loaded');

    // Add this debug function to check what's happening
function debugQRCodeGeneration() {
    console.log('=== QR CODE DEBUG INFO ===');
    
    // Test all QR code services
    const services = [
        'https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=TEST',
        'https://quickchart.io/qr?text=TEST&size=50',
        'http://api.qrserver.com/v1/create-qr-code/?data=TEST&size=50x50'
    ];
    
    services.forEach((url, index) => {
        const testImg = new Image();
        testImg.onload = () => console.log(`✓ Service ${index + 1} is accessible`);
        testImg.onerror = () => console.error(`✗ Service ${index + 1} is blocked`);
        testImg.src = url;
    });
}
    
    // Check authentication
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user) {
        window.location.href = '/';
        return;
    }
    
    // Set user name
    document.getElementById('userName').textContent = user.name;
    
    // Navigation elements
    const navLinks = document.querySelectorAll('.nav-links a');
    const dashboardSection = document.getElementById('dashboardSection');
    const eventsSection = document.getElementById('eventsSection');
    const ticketsSection = document.getElementById('ticketsSection');
    const profileSection = document.getElementById('profileSection');
    
    // Set up navigation
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Show the appropriate section
            const target = this.getAttribute('data-target') || this.getAttribute('href');
            
            switch(target) {
                case '#events':
                    showSection(eventsSection);
                    loadAllEvents();
                    break;
                case '#tickets':
                    showSection(ticketsSection);
                    loadTickets();
                    break;
                case '#profile':
                    showSection(profileSection);
                    loadProfile();
                    break;
                case '#logout':
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/';
                    break;
                default:
                    showSection(dashboardSection);
                    loadDashboard();
            }
        });
    });
    
    // Function to show a section and hide others
    function showSection(section) {
        // Hide all sections
        [dashboardSection, eventsSection, ticketsSection, profileSection].forEach(sec => {
            if (sec) sec.classList.add('hidden');
        });
        
        // Show the requested section
        if (section) section.classList.remove('hidden');
    }
    
    // Set dashboard as default active
    const defaultLink = document.querySelector('.nav-links a[data-target="#dashboard"], .nav-links a[href="#dashboard"]');
    if (defaultLink) {
        defaultLink.classList.add('active');
    }
    showSection(dashboardSection);
    
    // Load dashboard data
    loadDashboard();
    
    // Rest of your functions (loadDashboard, loadAllEvents, etc.)
    async function loadDashboard() {
        try {
            console.log('Loading dashboard data...');
            
            // Load events
            const eventsResponse = await fetch('/api/events');
            
            if (!eventsResponse.ok) {
                throw new Error(`Failed to fetch events: ${eventsResponse.status}`);
            }
            
            const events = await eventsResponse.json();
            console.log('Events loaded:', events);
            
            // Load user registrations
            const registrationsResponse = await fetch('/api/users/registrations', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!registrationsResponse.ok) {
                throw new Error(`Failed to fetch registrations: ${registrationsResponse.status}`);
            }
            
            const registrations = await registrationsResponse.json();
            console.log('Registrations loaded:', registrations);
            
            // Update stats
            const upcomingEventsElement = document.getElementById('upcomingEvents');
            const totalTicketsElement = document.getElementById('totalTickets');
            const pastEventsElement = document.getElementById('pastEvents');
            
            if (upcomingEventsElement) upcomingEventsElement.textContent = events.length;
            if (totalTicketsElement) totalTicketsElement.textContent = registrations.length;
            if (pastEventsElement) pastEventsElement.textContent = '0';
            
            // Display upcoming events
            const upcomingEventsGrid = document.getElementById('upcomingEventsGrid');
            if (upcomingEventsGrid) {
                upcomingEventsGrid.innerHTML = '';
                
                if (events.length === 0) {
                    upcomingEventsGrid.innerHTML = '<p class="text-center">No upcoming events found.</p>';
                    return;
                }
                
                events.forEach(event => {
                    const eventCard = createEventCard(event, true);
                    upcomingEventsGrid.appendChild(eventCard);
                });
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
            
            // Show error message to user
            const upcomingEventsGrid = document.getElementById('upcomingEventsGrid');
            if (upcomingEventsGrid) {
                upcomingEventsGrid.innerHTML = `
                    <div class="error-message">
                        <p>Error loading events: ${error.message}</p>
                        <button onclick="loadDashboard()" class="btn btn-primary">Try Again</button>
                    </div>
                `;
            }
        }
    }
    
    async function loadAllEvents() {
        try {
            console.log('Loading all events...');
            
            const response = await fetch('/api/events');
            
            if (!response.ok) {
                throw new Error(`Failed to fetch events: ${response.status}`);
            }
            
            const events = await response.json();
            console.log('All events loaded:', events);
            
            const allEventsGrid = document.getElementById('allEventsGrid');
            if (allEventsGrid) {
                allEventsGrid.innerHTML = '';
                
                if (events.length === 0) {
                    allEventsGrid.innerHTML = '<p class="text-center">No events found.</p>';
                    return;
                }
                
                events.forEach(event => {
                    const eventCard = createEventCard(event, false);
                    allEventsGrid.appendChild(eventCard);
                });
            }
        } catch (error) {
            console.error('Error loading events:', error);
            
            // Show error message to user
            const allEventsGrid = document.getElementById('allEventsGrid');
            if (allEventsGrid) {
                allEventsGrid.innerHTML = `
                    <div class="error-message">
                        <p>Error loading events: ${error.message}</p>
                        <button onclick="loadAllEvents()" class="btn btn-primary">Try Again</button>
                    </div>
                `;
            }
        }
    }
    
    function createEventCard(event, isDashboard) {
        const card = document.createElement('div');
        card.className = 'event-card';
        
        // Use _id instead of id for MongoDB documents
        const eventId = event._id || event.id;
        const eventDate = event.date ? new Date(event.date).toLocaleDateString() : 'Date not set';
        const eventTime = event.time || 'Time not set';
        const eventLocation = event.location || 'Location not specified';
        const registeredCount = event.registered || 0;
        const capacity = event.capacity || 0;
        
        card.innerHTML = `
            <div class="event-image">
                <i class="fas fa-calendar-alt"></i>
            </div>
            <div class="event-content">
                <h3 class="event-title">${event.title || 'Untitled Event'}</h3>
                <p>${event.description || 'No description available.'}</p>
                <div class="event-details">
                    <div><i class="fas fa-calendar"></i> ${eventDate}</div>
                    <div><i class="fas fa-clock"></i> ${eventTime}</div>
                    <div><i class="fas fa-map-marker-alt"></i> ${eventLocation}</div>
                    <div><i class="fas fa-users"></i> ${registeredCount} / ${capacity} registered</div>
                </div>
                <div class="event-actions">
                    <button class="btn btn-secondary view-details" data-id="${eventId}">Details</button>
                    <button class="btn btn-primary register-btn" data-id="${eventId}">Register</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        const registerBtn = card.querySelector('.register-btn');
        const viewDetailsBtn = card.querySelector('.view-details');
        
        if (registerBtn) {
            registerBtn.addEventListener('click', function() {
                registerForEvent(eventId);
            });
        }
        
        if (viewDetailsBtn) {
            viewDetailsBtn.addEventListener('click', function() {
                showEventDetails(event);
            });
        }
        
        return card;
    }
    
    async function registerForEvent(eventId) {
        try {
            console.log('Registering for event:', eventId);
            
            const response = await fetch(`/api/events/${eventId}/register`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Successfully registered for the event!');
                loadDashboard();
            } else {
                console.error('Registration failed:', data);
                alert(data.message || 'Registration failed. Please check the console for details.');
            }
        } catch (error) {
            console.error('Error registering for event:', error);
            alert('Registration failed. Please try again.');
        }
    }
    
    function showEventDetails(event) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        if (!modal || !modalTitle || !modalBody) {
            console.error('Modal elements not found');
            return;
        }
        
        const eventDate = event.date ? new Date(event.date).toLocaleDateString() : 'Date not set';
        const eventTime = event.time || 'Time not set';
        const eventLocation = event.location || 'Location not specified';
        const registeredCount = event.registered || 0;
        const capacity = event.capacity || 0;
        
        modalTitle.textContent = event.title || 'Untitled Event';
        
        modalBody.innerHTML = `
            <p><strong>Description:</strong> ${event.description || 'No description available.'}</p>
            <p><strong>Date:</strong> ${eventDate}</p>
            <p><strong>Time:</strong> ${eventTime}</p>
            <p><strong>Location:</strong> ${eventLocation}</p>
            <p><strong>Capacity:</strong> ${capacity} attendees</p>
            <p><strong>Registered:</strong> ${registeredCount} attendees</p>
            <div class="text-center" style="margin-top: 20px;">
                <button class="btn btn-primary" id="modalRegisterBtn">Register Now</button>
            </div>
        `;
        
        modal.classList.remove('hidden');
        
        document.getElementById('modalRegisterBtn').addEventListener('click', function() {
            registerForEvent(event._id || event.id);
            modal.classList.add('hidden');
        });
        
        // Close modal when clicking on X
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                modal.classList.add('hidden');
            });
        }
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }
    
    async function loadTickets() {
        try {
            console.log('Loading tickets...');
             debugQRCodeGeneration();
            
            const response = await fetch('/api/users/registrations', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to load tickets: ${response.status}`);
            }
            
            const registrations = await response.json();
            console.log('Registrations loaded:', registrations);
            
            const ticketsContainer = document.getElementById('ticketsContainer');
            
            if (!ticketsContainer) {
                console.error('Tickets container not found');
                return;
            }
            
            ticketsContainer.innerHTML = '';
            
            if (registrations.length === 0) {
                ticketsContainer.innerHTML = '<p class="text-center">You don\'t have any tickets yet.</p>';
                return;
            }
        
            // For each registration, create a ticket
            for (const registration of registrations) {
                // Extract the event ID properly
                let eventId;
                
                // Handle different possible structures of eventId
                if (registration.eventId && typeof registration.eventId === 'object') {
                    // If eventId is an object (like MongoDB ObjectId), get its string representation
                    eventId = registration.eventId._id || registration.eventId.$oid || registration.eventId.toString();
                } else {
                    // If eventId is already a string
                    eventId = registration.eventId;
                }
                
                console.log('Fetching event details for ID:', eventId);
                
                if (!eventId) {
                    console.error('No event ID found for registration:', registration);
                    continue;
                }
                
                try {
                    const eventResponse = await fetch(`/api/events/${eventId}`);
                    
                    if (!eventResponse.ok) {
                        throw new Error(`HTTP error! status: ${eventResponse.status}`);
                    }
                    
                    const event = await eventResponse.json();
                    
                    if (event) {
                        const ticketCard = document.createElement('div');
                        ticketCard.className = 'ticket-card';
                        
                        // Format registration date
                        const regDate = new Date(registration.registrationDate || registration.createdAt || Date.now());
                        const formattedDate = regDate.toLocaleDateString();
                        
                        // Generate unique QR code data
                        const qrData = generateQRCodeData(registration._id || registration.id, eventId, user.id);
                        
                        ticketCard.innerHTML = `
                            <div class="ticket-header">
                                <h3>${event.title || 'Unknown Event'}</h3>
                                <p>Registration Date: ${formattedDate}</p>
                            </div>
                            <div class="ticket-qr-container">
                                <div class="ticket-qr" id="qr-${registration._id || registration.id}">
                                    <div class="qr-loading">
                                        <i class="fas fa-spinner fa-spin"></i>
                                        <p>Generating QR code...</p>
                                    </div>
                                </div>
                                <p class="qr-note">Scan this QR code at the event entrance</p>
                            </div>
                            <div class="ticket-info">
                                <div>
                                    <span class="label">Event Date:</span>
                                    <span class="value">${event.date || 'TBA'}</span>
                                </div>
                                <div>
                                    <span class="label">Time:</span>
                                    <span class="value">${event.time || 'TBA'}</span>
                                </div>
                                <div>
                                    <span class="label">Location:</span>
                                    <span class="value">${event.location || 'Location not specified'}</span>
                                </div>
                                <div>
                                    <span class="label">Ticket ID:</span>
                                    <span class="value">${registration._id || registration.id}</span>
                                </div>
                            </div>
                        `;
                        
                        ticketsContainer.appendChild(ticketCard);
                        
                        // Generate QR code with delay to ensure DOM is ready
                        setTimeout(() => {
                            generateQRCode(registration._id || registration.id, qrData);
                        }, 100);
                    }
                } catch (error) {
                    console.error('Error loading event details:', error);
                    // Create a basic ticket even if event details can't be loaded
                    const ticketCard = document.createElement('div');
                    ticketCard.className = 'ticket-card';
                    ticketCard.innerHTML = `
                        <div class="ticket-header">
                            <h3>Event Details Unavailable</h3>
                            <p>Registration ID: ${registration._id || registration.id}</p>
                        </div>
                        <div class="ticket-info">
                            <p>Could not load event details. The event may have been removed.</p>
                        </div>
                    `;
                    ticketsContainer.appendChild(ticketCard);
                }
            }
        } catch (error) {
            console.error('Error loading tickets:', error);
            const ticketsContainer = document.getElementById('ticketsContainer');
            if (ticketsContainer) {
                ticketsContainer.innerHTML = '<p class="text-center error">Error loading tickets. Please try again later.</p>';
            }
        }
    }

    // Generate unique QR code data (ONLY ONE DEFINITION)
    function generateQRCodeData(registrationId, eventId, userId) {
        const timestamp = new Date().getTime();
        return `ACCESSLY:TICKET:${registrationId}:EVENT:${eventId}:USER:${userId}:TIMESTAMP:${timestamp}`;
    }

    // Generate QR code using Google Charts API with enhanced error handling
// Generate QR code using alternative services (not Google)
function generateQRCode(registrationId, qrData) {
    const qrElement = document.getElementById(`qr-${registrationId}`);
    
    if (!qrElement) {
        console.error('QR element not found for registration:', registrationId);
        return;
    }
    
    // Clear any existing content
    qrElement.innerHTML = '';
    
    try {
        console.log('Generating QR code for registration:', registrationId);
        
        // Try multiple QR code services (fallback chain)
        const encodedData = encodeURIComponent(qrData);
        
        // Service 1: QR Server API (primary)
        const qrUrl1 = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodedData}`;
        
        // Service 2: QuickChart API (backup)
        const qrUrl2 = `https://quickchart.io/qr?text=${encodedData}&size=150`;
        
        // Service 3: GoQR API (secondary backup)
        const qrUrl3 = `http://api.qrserver.com/v1/create-qr-code/?data=${encodedData}&size=150x150`;
        
        const qrImg = document.createElement('img');
        qrImg.alt = 'Event QR Code';
        qrImg.style.width = '150px';
        qrImg.style.height = '150px';
        qrImg.style.border = '5px solid white';
        qrImg.style.borderRadius = '8px';
        qrImg.style.backgroundColor = 'white';
        qrImg.style.display = 'block';
        qrImg.style.margin = '0 auto';
        
        // Try services in sequence
        let currentService = 1;
        qrImg.src = qrUrl1;
        
        qrImg.onerror = function() {
            console.log(`QR service ${currentService} failed, trying next...`);
            
            if (currentService === 1) {
                // Try service 2
                currentService = 2;
                qrImg.src = qrUrl2;
            } else if (currentService === 2) {
                // Try service 3
                currentService = 3;
                qrImg.src = qrUrl3;
            } else {
                // All services failed
                console.error('All QR code services failed');
                showFallbackQR(qrElement, registrationId);
            }
        };
        
        qrImg.onload = function() {
            console.log(`QR service ${currentService} worked successfully`);
            // Remove any loading indicators
            const loadingElements = qrElement.querySelectorAll('.qr-loading');
            loadingElements.forEach(el => el.remove());
        };
        
        qrElement.appendChild(qrImg);
        
    } catch (error) {
        console.error('Error generating QR code:', error);
        showFallbackQR(qrElement, registrationId);
    }
}

// Show fallback when QR code generation fails
function showFallbackQR(qrElement, registrationId) {
    console.log('Showing fallback QR for ticket:', registrationId);
    qrElement.innerHTML = `
        <div class="qr-fallback">
            <div class="qr-fallback-content">
                <i class="fas fa-ticket-alt fa-3x"></i>
                <p>Ticket ID: ${registrationId.substring(0, 8)}</p>
                <small>Present this ID at the event</small>
            </div>
        </div>
    `;
}

// Generate unique QR code data
function generateQRCodeData(registrationId, eventId, userId) {
    const timestamp = new Date().getTime();
    return `ACCESSLY:TICKET:${registrationId}:EVENT:${eventId}:USER:${userId}:TIMESTAMP:${timestamp}`;
}
    
    function loadProfile() {
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const memberSince = document.getElementById('memberSince');
        const eventsAttended = document.getElementById('eventsAttended');
        
        if (profileName) profileName.textContent = user.name;
        if (profileEmail) profileEmail.textContent = user.email;
        if (memberSince) memberSince.textContent = 'January 2023';
        if (eventsAttended) eventsAttended.textContent = '5';
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('modal');
            if (modal) modal.classList.add('hidden');
        }
    });
});