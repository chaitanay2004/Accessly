document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user) {
        window.location.href = '/';
        return;
    }
    
    // Set user name
    document.getElementById('userName').textContent = user.name;
    
    // Navigation
    const eventsLink = document.getElementById('eventsLink');
    const ticketsLink = document.getElementById('ticketsLink');
    const profileLink = document.getElementById('profileLink');
    const logoutBtn = document.getElementById('logoutBtn');
    
    const dashboardSection = document.getElementById('dashboardSection');
    const eventsSection = document.getElementById('eventsSection');
    const ticketsSection = document.getElementById('ticketsSection');
    const profileSection = document.getElementById('profileSection');
    
    eventsLink.addEventListener('click', function(e) {
        e.preventDefault();
        showSection(eventsSection);
        loadAllEvents();
    });
    
    ticketsLink.addEventListener('click', function(e) {
        e.preventDefault();
        showSection(ticketsSection);
        loadTickets();
    });
    
    profileLink.addEventListener('click', function(e) {
        e.preventDefault();
        showSection(profileSection);
        loadProfile();
    });
    
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    });
    
    function showSection(section) {
        // Hide all sections
        dashboardSection.classList.add('hidden');
        eventsSection.classList.add('hidden');
        ticketsSection.classList.add('hidden');
        profileSection.classList.add('hidden');
        
        // Show the selected section
        section.classList.remove('hidden');
    }
    
    // Load dashboard data
    loadDashboard();
    
    async function loadDashboard() {
        try {
            // Load events
            const eventsResponse = await fetch('/api/events');
            const events = await eventsResponse.json();
            
            // Load user registrations
            const registrationsResponse = await fetch('/api/users/registrations', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const registrations = await registrationsResponse.json();
            
            // Update stats
            document.getElementById('upcomingEvents').textContent = events.length;
            document.getElementById('totalTickets').textContent = registrations.length;
            document.getElementById('pastEvents').textContent = '0'; // Simplified for demo
            
            // Display upcoming events
            const upcomingEventsGrid = document.getElementById('upcomingEventsGrid');
            upcomingEventsGrid.innerHTML = '';
            
            events.forEach(event => {
                const eventCard = createEventCard(event, true);
                upcomingEventsGrid.appendChild(eventCard);
            });
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }
    
    async function loadAllEvents() {
        try {
            const response = await fetch('/api/events');
            const events = await response.json();
            
            const allEventsGrid = document.getElementById('allEventsGrid');
            allEventsGrid.innerHTML = '';
            
            events.forEach(event => {
                const eventCard = createEventCard(event, false);
                allEventsGrid.appendChild(eventCard);
            });
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }
    
    function createEventCard(event, isDashboard) {
        const card = document.createElement('div');
        card.className = 'event-card';
        
        card.innerHTML = `
            <div class="event-image">
                <i class="fas fa-calendar-alt"></i>
            </div>
            <div class="event-content">
                <h3 class="event-title">${event.title}</h3>
                <p>${event.description}</p>
                <div class="event-details">
                    <div><i class="fas fa-calendar"></i> ${event.date}</div>
                    <div><i class="fas fa-clock"></i> ${event.time}</div>
                    <div><i class="fas fa-map-marker-alt"></i> ${event.location}</div>
                    <div><i class="fas fa-users"></i> ${event.registered} / ${event.capacity} registered</div>
                </div>
                <div class="event-actions">
                    ${isDashboard ? 
                        `<button class="btn btn-secondary view-details" data-id="${event.id}">Details</button>` : 
                        `<button class="btn btn-secondary view-details" data-id="${event.id}">Details</button>`
                    }
                    <button class="btn btn-primary register-btn" data-id="${event.id}">Register</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        card.querySelector('.register-btn').addEventListener('click', function() {
            registerForEvent(event.id);
        });
        
        card.querySelector('.view-details').addEventListener('click', function() {
            showEventDetails(event);
        });
        
        return card;
    }
    
    async function registerForEvent(eventId) {
        try {
            const response = await fetch(`/api/events/${eventId}/register`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                alert('Successfully registered for the event!');
                loadDashboard();
            } else {
                const error = await response.json();
                alert(error.message || 'Registration failed');
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
        
        modalTitle.textContent = event.title;
        
        modalBody.innerHTML = `
            <p><strong>Description:</strong> ${event.description}</p>
            <p><strong>Date:</strong> ${event.date}</p>
            <p><strong>Time:</strong> ${event.time}</p>
            <p><strong>Location:</strong> ${event.location}</p>
            <p><strong>Capacity:</strong> ${event.capacity} attendees</p>
            <p><strong>Registered:</strong> ${event.registered} attendees</p>
            <div class="text-center" style="margin-top: 20px;">
                <button class="btn btn-primary" id="modalRegisterBtn">Register Now</button>
            </div>
        `;
        
        modal.classList.remove('hidden');
        
        document.getElementById('modalRegisterBtn').addEventListener('click', function() {
            registerForEvent(event.id);
            modal.classList.add('hidden');
        });
        
        // Close modal when clicking on X
        document.querySelector('.close').addEventListener('click', function() {
            modal.classList.add('hidden');
        });
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }
    
    async function loadTickets() {
        try {
            const response = await fetch('/api/users/registrations', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const registrations = await response.json();
            const ticketsContainer = document.getElementById('ticketsContainer');
            ticketsContainer.innerHTML = '';
            
            if (registrations.length === 0) {
                ticketsContainer.innerHTML = '<p class="text-center">You don\'t have any tickets yet.</p>';
                return;
            }
            
            // For each registration, create a ticket
            for (const registration of registrations) {
                const eventResponse = await fetch(`/api/events/${registration.eventId}`);
                const event = await eventResponse.ok ? await eventResponse.json() : null;
                
                if (event) {
                    const ticketCard = document.createElement('div');
                    ticketCard.className = 'ticket-card';
                    
                    ticketCard.innerHTML = `
                        <div class="ticket-header">
                            <h3>${event.title}</h3>
                            <p>Registration Date: ${registration.date}</p>
                        </div>
                        <div class="ticket-qr" id="qr-${registration.id}">
                            <!-- QR code will be generated here -->
                        </div>
                        <div class="ticket-info">
                            <div>
                                <span class="label">Event Date:</span>
                                <span class="value">${event.date}</span>
                            </div>
                            <div>
                                <span class="label">Time:</span>
                                <span class="value">${event.time}</span>
                            </div>
                            <div>
                                <span class="label">Location:</span>
                                <span class="value">${event.location}</span>
                            </div>
                        </div>
                    `;
                    
                    ticketsContainer.appendChild(ticketCard);
                    
                    // Generate QR code
                    generateQRCode(registration.id, event.id);
                }
            }
        } catch (error) {
            console.error('Error loading tickets:', error);
        }
    }
    
    function generateQRCode(registrationId, eventId) {
        // In a real app, this would fetch the QR code from the server
        // For demo purposes, we'll generate a simple QR code with dummy data
        const qrElement = document.getElementById(`qr-${registrationId}`);
        
        // Clear any existing content
        qrElement.innerHTML = '';
        
        // Create QR code with dummy data
        const qr = new QRCode(qrElement, {
            text: `ACCESSLY:TICKET|REG:${registrationId}|EVENT:${eventId}|USER:${user.id}`,
            width: 128,
            height: 128
        });
    }
    
    function loadProfile() {
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const memberSince = document.getElementById('memberSince');
        const eventsAttended = document.getElementById('eventsAttended');
        
        profileName.textContent = user.name;
        profileEmail.textContent = user.email;
        memberSince.textContent = 'January 2023'; // Hardcoded for demo
        eventsAttended.textContent = '5'; // Hardcoded for demo
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.getElementById('modal').classList.add('hidden');
        }
    });
});