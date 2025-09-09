document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user || user.role !== 'admin') {
        window.location.href = '/';
        return;
    }
    
    // Navigation
    const eventsLink = document.getElementById('eventsLink');
    const usersLink = document.getElementById('usersLink');
    const reportsLink = document.getElementById('reportsLink');
    const logoutBtn = document.getElementById('logoutBtn');
    
    const dashboardSection = document.getElementById('dashboardSection');
    const eventsSection = document.getElementById('eventsSection');
    const usersSection = document.getElementById('usersSection');
    const reportsSection = document.getElementById('reportsSection');
    
    eventsLink.addEventListener('click', function(e) {
        e.preventDefault();
        showSection(eventsSection);
        loadEvents();
    });
    
    usersLink.addEventListener('click', function(e) {
        e.preventDefault();
        showSection(usersSection);
        loadUsers();
    });
    
    reportsLink.addEventListener('click', function(e) {
        e.preventDefault();
        showSection(reportsSection);
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
        usersSection.classList.add('hidden');
        reportsSection.classList.add('hidden');
        
        // Show the selected section
        section.classList.remove('hidden');
    }
    
    // Load dashboard data
    loadDashboard();
    
    // Event modal handling
    const eventModal = document.getElementById('eventModal');
    const createEventBtn = document.getElementById('createEventBtn');
    const cancelEventBtn = document.getElementById('cancelEventBtn');
    const eventForm = document.getElementById('eventForm');
    
    createEventBtn.addEventListener('click', function() {
        document.getElementById('eventModalTitle').textContent = 'Create New Event';
        eventForm.reset();
        eventModal.classList.remove('hidden');
    });
    
    cancelEventBtn.addEventListener('click', function() {
        eventModal.classList.add('hidden');
    });
    
    eventForm.addEventListener('submit', function(e) {
        e.preventDefault();
        createEvent();
    });
    
    document.querySelector('.close').addEventListener('click', function() {
        eventModal.classList.add('hidden');
    });
    
    eventModal.addEventListener('click', function(e) {
        if (e.target === eventModal) {
            eventModal.classList.add('hidden');
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            eventModal.classList.add('hidden');
        }
    });
    
    // Report generation
    const generateReportBtn = document.getElementById('generateReportBtn');
    generateReportBtn.addEventListener('click', generateReport);
    
    async function loadDashboard() {
        try {
            const response = await fetch('/api/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
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
            const response = await fetch('/api/admin/events', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const events = await response.json();
                const recentEventsTable = document.getElementById('recentEventsTable');
                recentEventsTable.innerHTML = '';
                
                // Show only 5 most recent events
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
            const response = await fetch('/api/admin/events', {
                headers: {
                    'Authorization': `Bearer ${token}`
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
                            <button class="btn btn-sm btn-primary">Edit</button>
                            <button class="btn btn-sm btn-danger">Delete</button>
                        </td>
                    `;
                    
                    eventsTable.appendChild(row);
                });
            }
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }
    
    async function loadUsers() {
        try {
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
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
                    
                    // Store the user data directly on the element
                    const button = row.querySelector('.view-user-btn');
                    button.userData = user;
                    
                    usersTable.appendChild(row);
                });
                
                // Add event listeners to view buttons
                document.querySelectorAll('.view-user-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        showUserDetails(this.userData);
                    });
                });
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }
    
    async function createEvent() {
        try {
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
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });
            
            if (response.ok) {
                const newEvent = await response.json();
                alert('Event created successfully!');
                eventModal.classList.add('hidden');
                
                // Reload events if we're on the events page
                if (!eventsSection.classList.contains('hidden')) {
                    loadEvents();
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

   // Function to show user details
function showUserDetails(user) {
    const modal = document.getElementById('eventModal');
    const modalTitle = document.getElementById('eventModalTitle');
    const modalBody = document.getElementById('eventForm');
    
    // Remove any existing event listeners from the form
    const newForm = modalBody.cloneNode(false);
    modalBody.parentNode.replaceChild(newForm, modalBody);
    const newModalBody = document.getElementById('eventForm');
    
    modalTitle.textContent = `User Details: ${user.name}`;
    
    // Make sure we have a valid user ID
    const userId = user._id || user.id;
    console.log('Showing user details for ID:', userId);
    
    newModalBody.innerHTML = `
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
    
    // Make admin functionality
    const makeAdminBtn = document.getElementById('makeAdminBtn');
    if (makeAdminBtn) {
        makeAdminBtn.addEventListener('click', function() {
            const userId = this.getAttribute('data-userid');
            console.log('Make admin button clicked with ID:', userId);
            makeUserAdmin(userId);
        });
    }
    
    // Remove admin functionality
    const removeAdminBtn = document.getElementById('removeAdminBtn');
    if (removeAdminBtn) {
        removeAdminBtn.addEventListener('click', function() {
            const userId = this.getAttribute('data-userid');
            console.log('Remove admin button clicked with ID:', userId);
            removeUserAdmin(userId);
        });
    }
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
    
    // Prevent form submission when Enter key is pressed
    newModalBody.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    });
}
    // Function to make user admin
    async function makeUserAdmin(userId) {
        try {
            console.log('Making user admin with ID:', userId);
            
            if (!userId || userId === 'undefined') {
                alert('Invalid user ID');
                return;
            }

            const response = await fetch(`/api/admin/users/${userId}/make-admin`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                alert('User role updated to admin successfully!');
                document.getElementById('eventModal').classList.add('hidden');
                loadUsers();
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to update user role');
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

            const response = await fetch(`/api/admin/users/${userId}/remove-admin`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                alert('Admin role removed successfully!');
                document.getElementById('eventModal').classList.add('hidden');
                loadUsers();
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to update user role');
            }
        } catch (error) {
            console.error('Error removing admin role:', error);
            alert('Failed to update user role. Please try again.');
        }
    }
});