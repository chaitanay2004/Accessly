document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user || user.role !== 'admin') {
        window.location.href = '/';
        return;
    }
    
    // Store current editing event ID
    let currentEditingEventId = null;
    
    // Navigation
    const dashboardLink = document.querySelector('a[href="#dashboard"]');
    const eventsLink = document.getElementById('eventsLink');
    const usersLink = document.getElementById('usersLink');
    const reportsLink = document.getElementById('reportsLink');
    const logoutBtn = document.getElementById('logoutBtn');
    
    const dashboardSection = document.getElementById('dashboardSection');
    const eventsSection = document.getElementById('eventsSection');
    const usersSection = document.getElementById('usersSection');
    const reportsSection = document.getElementById('reportsSection');
    
    // Add dashboard link functionality
    if (dashboardLink) {
        dashboardLink.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Dashboard link clicked');
            showSection(dashboardSection);
            updateActiveNav(this);
            loadDashboard();
        });
    }
    
    eventsLink.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Events link clicked');
        showSection(eventsSection);
        updateActiveNav(this);
        loadEvents();
    });
    
    usersLink.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Users link clicked');
        showSection(usersSection);
        updateActiveNav(this);
        loadUsers();
    });
    
    reportsLink.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Reports link clicked');
        showSection(reportsSection);
        updateActiveNav(this);
    });
    
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    });
    
    function showSection(section) {
        console.log('Showing section:', section.id);
        // Hide all sections
        dashboardSection.classList.add('hidden');
        eventsSection.classList.add('hidden');
        usersSection.classList.add('hidden');
        reportsSection.classList.add('hidden');
        
        // Show the selected section
        section.classList.remove('hidden');
    }
    
    function updateActiveNav(clickedLink) {
        // Remove active class from all links
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to clicked link
        clickedLink.classList.add('active');
    }
    
    // Load dashboard data
    loadDashboard();
    
    // Event modal handling
    const eventModal = document.getElementById('eventModal');
    const createEventBtn = document.getElementById('createEventBtn');
    const cancelEventBtn = document.getElementById('cancelEventBtn');
    const eventForm = document.getElementById('eventForm');
    
    createEventBtn.addEventListener('click', function() {
        currentEditingEventId = null;
        document.getElementById('eventModalTitle').textContent = 'Create New Event';
        eventForm.reset();
        
        // Reset form to original structure for creating events
        resetEventForm();
        eventModal.classList.remove('hidden');
    });
    
    cancelEventBtn.addEventListener('click', function() {
        eventModal.classList.add('hidden');
        currentEditingEventId = null;
    });
    
    eventForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (currentEditingEventId) {
            updateEvent(currentEditingEventId);
        } else {
            createEvent();
        }
    });
    
    document.querySelector('.close').addEventListener('click', function() {
        eventModal.classList.add('hidden');
        currentEditingEventId = null;
    });
    
    eventModal.addEventListener('click', function(e) {
        if (e.target === eventModal) {
            eventModal.classList.add('hidden');
            currentEditingEventId = null;
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            eventModal.classList.add('hidden');
            currentEditingEventId = null;
        }
    });
    
    // Report generation
    const generateReportBtn = document.getElementById('generateReportBtn');
    generateReportBtn.addEventListener('click', generateReport);
    
    // Function to reset event form to original structure
    function resetEventForm() {
        eventForm.innerHTML = `
            <div class="form-group">
                <label for="eventTitle">Event Title</label>
                <input type="text" id="eventTitle" required>
            </div>
            <div class="form-group">
                <label for="eventDescription">Description</label>
                <textarea id="eventDescription" rows="3" required></textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="eventDate">Date</label>
                    <input type="date" id="eventDate" required>
                </div>
                <div class="form-group">
                    <label for="eventTime">Time</label>
                    <input type="time" id="eventTime" required>
                </div>
            </div>
            <div class="form-group">
                <label for="eventLocation">Location</label>
                <input type="text" id="eventLocation" required>
            </div>
            <div class="form-group">
                <label for="eventCapacity">Capacity</label>
                <input type="number" id="eventCapacity" min="1" required>
            </div>
            <div class="form-actions">
                <button type="button" id="cancelEventBtn" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Event</button>
            </div>
        `;
        
        // Re-attach cancel button event listener
        document.getElementById('cancelEventBtn').addEventListener('click', function() {
            eventModal.classList.add('hidden');
            currentEditingEventId = null;
        });
    }
    
    // Function to check and refresh token
    async function checkAndRefreshToken() {
        try {
            const currentToken = localStorage.getItem('token');
            if (!currentToken) {
                throw new Error('No token found');
            }
            
            // Decode the token to check expiration without verifying
            const payload = JSON.parse(atob(currentToken.split('.')[1]));
            const expirationTime = payload.exp * 1000;
            const currentTime = Date.now();
            const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
            
            // If token expires in less than 5 minutes, refresh it
            if (expirationTime - currentTime < bufferTime) {
                console.log('Token expiring soon, refreshing...');
                const response = await fetch('/api/auth/refresh', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${currentToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('token', data.token);
                    console.log('Token refreshed successfully');
                    return data.token;
                } else {
                    throw new Error('Failed to refresh token');
                }
            }
            
            return currentToken;
        } catch (error) {
            console.error('Token refresh error:', error);
            localStorage.removeItem('token');
            localStorage.removeUser('user');
            window.location.href = '/';
            throw error;
        }
    }
    
    async function loadDashboard() {
        try {
            const validToken = await checkAndRefreshToken();
            const response = await fetch('/api/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${validToken}`
                }
            });
            
            if (response.ok) {
                const stats = await response.json();
                
                // Update stats
                document.getElementById('totalEvents').textContent = stats.totalEvents;
                document.getElementById('totalUsers').textContent = stats.totalUsers;
                document.getElementById('totalRegistrations').textContent = stats.totalRegistrations;
                document.getElementById('totalRevenue').textContent = `$${stats.totalRevenue}`;
                
                // Load recent events
                await loadRecentEvents();
                
                // Create charts
                createCharts();
            } else {
                console.error('Failed to load dashboard stats');
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }
    
    async function loadRecentEvents() {
        try {
            const validToken = await checkAndRefreshToken();
            const response = await fetch('/api/admin/events', {
                headers: {
                    'Authorization': `Bearer ${validToken}`
                }
            });
            
            if (response.ok) {
                const events = await response.json();
                const recentEventsTable = document.getElementById('recentEventsTable');
                recentEventsTable.innerHTML = '';
                
                const recentEvents = events.slice(0, 5);
                
                recentEvents.forEach(event => {
                    const row = document.createElement('tr');
                    
                    row.innerHTML = `
                        <td>${event.title}</td>
                        <td>${event.date}</td>
                        <td>${event.registered}</td>
                        <td>${event.capacity}</td>
                        <td>$${event.revenue}</td>
                        <td>
                            <button class="btn btn-sm btn-primary">View</button>
                        </td>
                    `;
                    
                    recentEventsTable.appendChild(row);
                });
            }
        } catch (error) {
            console.error('Error loading recent events:', error);
        }
    }
    
    async function loadEvents() {
        try {
            const validToken = await checkAndRefreshToken();
            const response = await fetch('/api/admin/events', {
                headers: {
                    'Authorization': `Bearer ${validToken}`
                }
            });
            
            if (response.ok) {
                const events = await response.json();
                const eventsTable = document.getElementById('eventsTable');
                eventsTable.innerHTML = '';
                
                events.forEach(event => {
                    const row = document.createElement('tr');
                    const status = new Date(event.date) > new Date() ? 'Upcoming' : 'Completed';
                    
                    row.innerHTML = `
                        <td>${event.title}</td>
                        <td>${event.date}</td>
                        <td>${event.location || 'N/A'}</td>
                        <td>${event.registered}</td>
                        <td>${event.capacity}</td>
                        <td class="${status === 'Upcoming' ? 'status-active' : 'status-inactive'}">${status}</td>
                        <td>
                            <button class="btn btn-sm btn-primary edit-event-btn" data-event-id="${event._id || event.id}">Edit</button>
                            <button class="btn btn-sm btn-danger delete-event-btn" data-event-id="${event._id || event.id}">Delete</button>
                        </td>
                    `;
                    
                    // Store event data on the row for easy access
                    row.eventData = event;
                    eventsTable.appendChild(row);
                });
                
                // Add event listeners for edit and delete buttons
                document.querySelectorAll('.edit-event-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const eventId = this.getAttribute('data-event-id');
                        const eventData = this.closest('tr').eventData;
                        editEvent(eventId, eventData);
                    });
                });
                
                document.querySelectorAll('.delete-event-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const eventId = this.getAttribute('data-event-id');
                        deleteEvent(eventId);
                    });
                });
            }
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }
    
    async function loadUsers() {
        try {
            const validToken = await checkAndRefreshToken();
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${validToken}`
                }
            });
            
            if (response.ok) {
                const users = await response.json();
                const usersTable = document.getElementById('usersTable');
                usersTable.innerHTML = '';
                
                users.forEach(user => {
                    const row = document.createElement('tr');
                    
                    row.innerHTML = `
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td>${user.registrations || 0}</td>
                        <td>${new Date().toLocaleDateString()}</td>
                        <td class="status-active">Active</td>
                        <td>
                            <button class="btn btn-sm btn-primary view-user-btn" data-userid="${user._id || user.id}">View</button>
                        </td>
                    `;
                    
                    row.userData = user;
                    usersTable.appendChild(row);
                });
                
                // Add event listeners to view buttons
                document.querySelectorAll('.view-user-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const userData = this.closest('tr').userData;
                        showUserDetails(userData);
                    });
                });
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }
    
    // Function to edit event
    function editEvent(eventId, eventData) {
        currentEditingEventId = eventId;
        document.getElementById('eventModalTitle').textContent = 'Edit Event';
        
        // Reset form structure first
        resetEventForm();
        
        // Populate form with event data
        document.getElementById('eventTitle').value = eventData.title || '';
        document.getElementById('eventDescription').value = eventData.description || '';
        document.getElementById('eventDate').value = eventData.date || '';
        document.getElementById('eventTime').value = eventData.time || '';
        document.getElementById('eventLocation').value = eventData.location || '';
        document.getElementById('eventCapacity').value = eventData.capacity || '';
        
        eventModal.classList.remove('hidden');
    }
    
    // Function to update event
    async function updateEvent(eventId) {
        try {
            const validToken = await checkAndRefreshToken();
            const eventData = {
                title: document.getElementById('eventTitle').value,
                description: document.getElementById('eventDescription').value,
                date: document.getElementById('eventDate').value,
                time: document.getElementById('eventTime').value,
                location: document.getElementById('eventLocation').value,
                capacity: parseInt(document.getElementById('eventCapacity').value)
            };
            
            const response = await fetch(`/api/admin/events/${eventId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${validToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });
            
            if (response.ok) {
                alert('Event updated successfully!');
                eventModal.classList.add('hidden');
                currentEditingEventId = null;
                
                // Reload events
                if (!eventsSection.classList.contains('hidden')) {
                    loadEvents();
                }
                // Also reload dashboard if visible
                if (!dashboardSection.classList.contains('hidden')) {
                    loadDashboard();
                }
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to update event');
            }
        } catch (error) {
            console.error('Error updating event:', error);
            alert('Failed to update event. Please try again.');
        }
    }
    
    // Function to delete event
    async function deleteEvent(eventId) {
        if (!confirm('Are you sure you want to delete this event?')) {
            return;
        }
        
        try {
            const validToken = await checkAndRefreshToken();
            const response = await fetch(`/api/admin/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${validToken}`
                }
            });
            
            if (response.ok) {
                alert('Event deleted successfully!');
                loadEvents();
                // Also reload dashboard if visible
                if (!dashboardSection.classList.contains('hidden')) {
                    loadDashboard();
                }
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to delete event');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Failed to delete event. Please try again.');
        }
    }
    
    async function createEvent() {
        try {
            const validToken = await checkAndRefreshToken();
            const eventData = {
                title: document.getElementById('eventTitle').value,
                description: document.getElementById('eventDescription').value,
                date: document.getElementById('eventDate').value,
                time: document.getElementById('eventTime').value,
                location: document.getElementById('eventLocation').value,
                capacity: parseInt(document.getElementById('eventCapacity').value)
            };
            
            const response = await fetch('/api/admin/events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${validToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });
            
            if (response.ok) {
                alert('Event created successfully!');
                eventModal.classList.add('hidden');
                
                // Reload events if we're on the events page
                if (!eventsSection.classList.contains('hidden')) {
                    loadEvents();
                }
                // Also reload dashboard if visible
                if (!dashboardSection.classList.contains('hidden')) {
                    loadDashboard();
                }
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to create event');
            }
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Failed to create event. Please try again.');
        }
    }
    
    function createCharts() {
        // Registration chart
        const registrationsCtx = document.getElementById('registrationsChart').getContext('2d');
        new Chart(registrationsCtx, {
            type: 'bar',
            data: {
                labels: ['Tech Conference', 'Academic Symposium', 'Music Festival'],
                datasets: [{
                    label: 'Registrations',
                    data: [247, 189, 756],
                    backgroundColor: [
                        'rgba(67, 97, 238, 0.7)',
                        'rgba(58, 12, 163, 0.7)',
                        'rgba(247, 37, 133, 0.7)'
                    ],
                    borderColor: [
                        'rgb(67, 97, 238)',
                        'rgb(58, 12, 163)',
                        'rgb(247, 37, 133)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        // Revenue chart
        const revenueCtx = document.getElementById('revenueChart').getContext('2d');
        new Chart(revenueCtx, {
            type: 'doughnut',
            data: {
                labels: ['Tech Conference', 'Academic Symposium', 'Music Festival'],
                datasets: [{
                    label: 'Revenue',
                    data: [12350, 9450, 37800],
                    backgroundColor: [
                        'rgba(67, 97, 238, 0.7)',
                        'rgba(58, 12, 163, 0.7)',
                        'rgba(247, 37, 133, 0.7)'
                    ],
                    borderColor: [
                        'rgb(67, 97, 238)',
                        'rgb(58, 12, 163)',
                        'rgb(247, 37, 133)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    function generateReport() {
        const reportType = document.getElementById('reportType').value;
        const dateRange = document.getElementById('dateRange').value;
        
        const reportCtx = document.getElementById('reportChart').getContext('2d');
        
        // Clear any existing chart
        if (window.reportChart) {
            window.reportChart.destroy();
        }
        
        // Sample data based on report type
        let data, labels, chartType, backgroundColor;
        
        switch (reportType) {
            case 'registrations':
                labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
                data = [120, 150, 180, 210];
                chartType = 'line';
                backgroundColor = 'rgba(67, 97, 238, 0.2)';
                break;
            case 'revenue':
                labels = ['Tech', 'Academic', 'Music', 'Other'];
                data = [12350, 9450, 37800, 5200];
                chartType = 'bar';
                backgroundColor = [
                    'rgba(67, 97, 238, 0.7)',
                    'rgba(58, 12, 163, 0.7)',
                    'rgba(247, 37, 133, 0.7)',
                    'rgba(76, 201, 240, 0.7)'
                ];
                break;
            case 'attendance':
                labels = ['Present', 'Absent'];
                data = [85, 15];
                chartType = 'pie';
                backgroundColor = [
                    'rgba(67, 97, 238, 0.7)',
                    'rgba(239, 71, 111, 0.7)'
                ];
                break;
        }
        
        window.reportChart = new Chart(reportCtx, {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: reportType.charAt(0).toUpperCase() + reportType.slice(1),
                    data: data,
                    backgroundColor: backgroundColor,
                    borderColor: 'rgb(67, 97, 238)',
                    borderWidth: 1,
                    fill: chartType === 'line'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - Last ${dateRange} days`
                    }
                }
            }
        });
    }

    // Function to show user details in a separate modal or reuse the event modal carefully
    function showUserDetails(user) {
        const modal = document.getElementById('eventModal');
        const modalTitle = document.getElementById('eventModalTitle');
        const modalBody = document.getElementById('eventForm');
        
        modalTitle.textContent = `User Details: ${user.name}`;
        
        const userId = user._id || user.id;
        console.log('Showing user details for ID:', userId);
        
        modalBody.innerHTML = `
            <div class="user-details">
                <div class="detail-item">
                    <label>Name:</label>
                    <span>${user.name}</span>
                </div>
                <div class="detail-item">
                    <label>Email:</label>
                    <span>${user.email}</span>
                </div>
                <div class="detail-item">
                    <label>Role:</label>
                    <span class="badge ${user.role === 'admin' ? 'badge-admin' : 'badge-user'}">${user.role}</span>
                </div>
                <div class="detail-item">
                    <label>Registrations:</label>
                    <span>${user.registrations || 0}</span>
                </div>
                <div class="detail-item">
                    <label>User ID:</label>
                    <span class="user-id">${userId}</span>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="closeUserModal">Close</button>
                    ${user.role !== 'admin' ? 
                        `<button type="button" class="btn btn-danger" id="makeAdminBtn" data-userid="${userId}">Make Admin</button>` : 
                        `<button type="button" class="btn btn-warning" id="removeAdminBtn" data-userid="${userId}">Remove Admin</button>`
                    }
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
        
        // Add event listeners
        document.getElementById('closeUserModal').addEventListener('click', function() {
            modal.classList.add('hidden');
        });
        
        // Add event listeners for admin buttons
        const makeAdminBtn = document.getElementById('makeAdminBtn');
        const removeAdminBtn = document.getElementById('removeAdminBtn');
        
        if (makeAdminBtn) {
            makeAdminBtn.addEventListener('click', function() {
                const userId = this.getAttribute('data-userid');
                makeUserAdmin(userId);
            });
        }
        
        if (removeAdminBtn) {
            removeAdminBtn.addEventListener('click', function() {
                const userId = this.getAttribute('data-userid');
                removeUserAdmin(userId);
            });
        }
    }

    // Function to make user admin
    async function makeUserAdmin(userId) {
        try {
            console.log('Making user admin with ID:', userId);
            
            if (!userId || userId === 'undefined') {
                alert('Invalid user ID');
                return;
            }

            const validToken = await checkAndRefreshToken();
            const response = await fetch(`/api/admin/users/${userId}/make-admin`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${validToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('User role updated to admin successfully!');
                document.getElementById('eventModal').classList.add('hidden');
                loadUsers();
            } else {
                if (response.status === 401) {
                    alert('Your session has expired. Please login again.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/';
                } else {
                    console.error('Server error response:', data);
                    alert(data.message || 'Failed to update user role. Please check the console for details.');
                }
            }
        } catch (error) {
            console.error('Error making user admin:', error);
            alert('Failed to update user role. Please try again.');
        }
    }

    // Function to remove admin role
    async function removeUserAdmin(userId) {
        try {
            console.log('Removing admin role from user with ID:', userId);
            
            if (!userId || userId === 'undefined') {
                alert('Invalid user ID');
                return;
            }

            const validToken = await checkAndRefreshToken();
            const response = await fetch(`/api/admin/users/${userId}/remove-admin`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${validToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Admin role removed successfully!');
                document.getElementById('eventModal').classList.add('hidden');
                loadUsers();
            } else {
                if (response.status === 401) {
                    alert('Your session has expired. Please login again.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/';
                } else {
                    console.error('Server error response:', data);
                    alert(data.message || 'Failed to update user role. Please check the console for details.');
                }
            }
        } catch (error) {
            console.error('Error removing admin role:', error);
            alert('Failed to update user role. Please try again.');
        }
    }
});