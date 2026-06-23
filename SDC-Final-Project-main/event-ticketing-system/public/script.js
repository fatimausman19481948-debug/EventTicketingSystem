// script.js
// Backend URL placeholder - replace with your actual backend URL
const API_BASE = "https://5tawzbvqwf.execute-api.us-east-1.amazonaws.com/SrsPottuh";

// DOM elements
const container = document.getElementById('app-container');

// Application state
let currentPage = 'index';
let pollingInterval = null;
let countdownTimer = null;
let countdownSeconds = 300; // 5 minutes countdown for allowed page
function autoLeaveQueue() {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const payload = JSON.stringify({ userId });

    navigator.sendBeacon(
        API_BASE + "/leaveQueue",
        payload
    );

    localStorage.removeItem("userId");
}
function resetUserState() {
    // Clear all localStorage items
    localStorage.removeItem("userId");
    localStorage.removeItem("userStatus");
    
    // Clear intervals
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
    
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
    }
    
    // Reset countdown
    countdownSeconds = 300;
}


// Page templates
const pages = {
    index: `
        <div class="page" id="index-page">
            <div class="header">
                <h1><i class="fas fa-calendar-alt"></i> Tech Summit 2023</h1>
                <p>Join the queue for exclusive early access to tickets</p>
            </div>
            
            <div class="event-info">
                <h2><i class="fas fa-info-circle"></i> Event Details</h2>
                <p>The biggest tech conference of the year featuring industry leaders, cutting-edge technology demonstrations, and networking opportunities.</p>
                
                <div class="event-details">
                    <div class="detail-item">
                        <i class="fas fa-calendar-day"></i>
                        <div>
                            <strong>Date:</strong> November 15-17, 2023
                        </div>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <div>
                            <strong>Location:</strong> San Francisco Convention Center
                        </div>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-clock"></i>
                        <div>
                            <strong>Time:</strong> 9:00 AM - 6:00 PM Daily
                        </div>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-ticket-alt"></i>
                        <div>
                            <strong>Tickets Available:</strong> Limited to 500 attendees
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="queue-info">
                <h2><i class="fas fa-hourglass-half"></i> How It Works</h2>
                <p>To ensure a fair ticket purchasing experience, we're using a virtual queue system:</p>
                <ol style="margin: 15px 0 15px 20px; color: #555;">
                    <li>Click "Join Queue" to get in line</li>
                    <li>Wait your turn on the queue page</li>
                    <li>When it's your turn, you'll be redirected to purchase tickets</li>
                    <li>You'll have 5 minutes to complete your purchase</li>
                </ol>
            </div>
            
            <button id="joinQueue" class="btn btn-primary">
                <i class="fas fa-sign-in-alt"></i> Join Queue
            </button>
            
            <div class="footer">
                <p>Already in queue? <a href="#" id="checkStatusLink">Check your status</a></p>
            </div>
        </div>
    `,
    
    queue: `
        <div class="page" id="queue-page">
            <div class="header">
                <h1><i class="fas fa-hourglass-half"></i> You're in the Queue</h1>
                <p>Please wait while we secure your spot</p>
            </div>
            
            <div class="queue-status">
                <div class="queue-icon">
                    <i class="fas fa-user-clock"></i>
                </div>
                
                <div class="position" id="position">--</div>
                
                <div class="status-message" id="status-message">
                    Calculating your position...
                </div>
                
                <div class="progress-container">
                    <div class="progress-bar" id="progress-bar"></div>
                </div>
                
                <p>People ahead of you: <span id="people-ahead">--</span></p>
                <p>Estimated wait time: <span id="wait-time">--</span></p>
            </div>
            
            <div class="loading">
                <div class="spinner"></div>
                <p>Checking your status every 5 seconds...</p>
            </div>
            
            <div class="footer">
                <p>Your Queue ID: <span class="user-id" id="user-id-display">Not found</span></p>
                <button id="leaveQueue" class="btn btn-secondary" style="margin-top: 15px;">
                    <i class="fas fa-sign-out-alt"></i> Leave Queue
                </button>
            </div>
        </div>
    `,
    
    allowed: `
        <div class="page" id="allowed-page">
            <div class="header">
                <h1><i class="fas fa-check-circle"></i> It's Your Turn!</h1>
                <p>Welcome to the ticket purchase portal</p>
            </div>
            
            <div class="queue-status">
                <div class="queue-icon" style="color: #2ecc71;">
                    <i class="fas fa-ticket-alt"></i>
                </div>
                
                <h2 style="color: #2ecc71; margin-bottom: 20px;">Access Granted</h2>
                
                <div class="countdown" id="countdown">05:00</div>
                
                <div class="status-message">
                    You have <strong>5 minutes</strong> to complete your purchase before your spot is released
                </div>
            </div>
            
            <div class="event-info">
                <h2><i class="fas fa-shopping-cart"></i> Ticket Selection</h2>
                
                <div class="ticket-options" style="margin-top: 20px;">
                    <div class="ticket-option" style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 15px;">
                        <h3>General Admission</h3>
                        <p>Access to all keynote speeches, exhibition halls, and networking events.</p>
                        <p><strong>Price: $299</strong></p>
                        <button class="btn btn-primary" style="width: auto; padding: 10px 20px; margin-top: 10px;">
                            <i class="fas fa-cart-plus"></i> Add to Cart
                        </button>
                    </div>
                    
                    <div class="ticket-option" style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 15px;">
                        <h3>VIP Pass</h3>
                        <p>Includes General Admission plus VIP lounge access, premium seating, and exclusive dinner.</p>
                        <p><strong>Price: $599</strong></p>
                        <button class="btn btn-primary" style="width: auto; padding: 10px 20px; margin-top: 10px;">
                            <i class="fas fa-cart-plus"></i> Add to Cart
                        </button>
                    </div>
                </div>
                
                <button id="purchaseTickets" class="btn btn-success">
                    <i class="fas fa-lock"></i> Proceed to Checkout
                </button>
            </div>
            
            <div class="footer">
                <p>If you leave this page, you may lose your spot in the queue.</p>
            </div>
        </div>
    `
};

// Initialize the application
function init() {
    // Check if user already has a userId in localStorage
    const userId = localStorage.getItem("userId");
    
    // Determine which page to show based on URL or stored data
    const path = window.location.pathname;
    
    if (path.includes("queue.html") || (userId && currentPage === "index")) {
        // If user has a userId and tries to access index, check their status
        // For simplicity, we'll just redirect to queue if they have a userId
        if (userId && !path.includes("queue.html") && !path.includes("allowed.html")) {
            loadPage('queue');
            return;
        }
    }
    
    // Default to index page
    loadPage('index');
    
    // Set up event listeners for navigation
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'checkStatusLink') {
            e.preventDefault();
            const userId = localStorage.getItem("userId");
            if (userId) {
                loadPage('queue');
            } else {
                alert("You haven't joined the queue yet. Please join first.");
            }
        }
    });
}

// Load a specific page
function loadPage(pageName) {
    currentPage = pageName;
    container.innerHTML = pages[pageName];
    
    // Update browser history (simulate page change without actual navigation)
    history.pushState({ page: pageName }, '', `${pageName}.html`);
    
    // Set up page-specific event listeners
    if (pageName === 'index') {
        setupIndexPage();
    } else if (pageName === 'queue') {
        setupQueuePage();
    } else if (pageName === 'allowed') {
        setupAllowedPage();
    }
}

// Set up index page event listeners
function setupIndexPage() {
    const joinQueueBtn = document.getElementById('joinQueue');
    if (joinQueueBtn) {
        joinQueueBtn.addEventListener('click', joinQueue);
    }
}

// Set up queue page event listeners
function setupQueuePage() {
    const userId = localStorage.getItem("userId");
    
    if (!userId) {
        // If no userId, redirect to index
        loadPage('index');
        return;
    }
    
    // Display userId
    const userIdDisplay = document.getElementById('user-id-display');
    if (userIdDisplay) {
        userIdDisplay.textContent = userId;
    }
    
    // Set up leave queue button
    const leaveQueueBtn = document.getElementById('leaveQueue');
    if (leaveQueueBtn) {
     leaveQueueBtn.addEventListener("click", async () => {
    const userId = localStorage.getItem("userId");

    await fetch(API_BASE + "/leaveQueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
    });

    localStorage.removeItem("userId");
    clearInterval(pollingInterval);
    loadPage("index");
});

    }
    
    // Start polling for status
    startPolling();
}

// Set up allowed page event listeners
function setupAllowedPage() {
    // Start countdown timer
    startCountdown();
    
    // Set up purchase button
    const purchaseBtn = document.getElementById('purchaseTickets');
    if (purchaseBtn) {
        purchaseBtn.addEventListener('click', function() {
            alert("Thank you for your purchase! Your tickets will be emailed to you shortly.");
            // In a real app, this would process the payment
            // After purchase, clear the userId
            localStorage.removeItem("userId");
            clearInterval(countdownTimer);
        });
    }
}

// Join queue function
async function joinQueue() {
    const joinQueueBtn = document.getElementById('joinQueue');
    
    if (joinQueueBtn) {
        // Disable button and show loading state
        joinQueueBtn.disabled = true;
        joinQueueBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Joining Queue...';
    }
    
    try {
        // In a real app, this would call your backend API
        // For demo purposes, we'll simulate the API call
        
        // Simulate API delay
        const response = await fetch(API_BASE + "/joinQueue", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({ userId: "frontend-user" })
});
   if (!response.ok) {
            alert(`API returned error: ${response.status} ${response.statusText}`);
            console.error("API returned error:", response);
            joinQueueBtn.disabled = false;
            joinQueueBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Join Queue';
            return;
        }
const data = await response.json();

// store backend-generated userId
localStorage.setItem("userId", data.userId);

// go to queue page
loadPage("queue");

        
    } catch (error) {
        console.error('Error joining queue:', error);
        alert('Failed to join queue. Please try again.');
        
        if (joinQueueBtn) {
            joinQueueBtn.disabled = false;
            joinQueueBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Join Queue';
        }
    }
}

// Start polling for queue status
function startPolling() {
    // Clear any existing interval
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
    
    // Initial check
    checkStatus();
    
    // Set up interval for polling every 5 seconds
    pollingInterval = setInterval(checkStatus, 5000);
}

// Check queue status
async function checkStatus() {
    const userId = localStorage.getItem("userId");
    
    if (!userId) {
        // No userId, redirect to index
        resetUserState();
        loadPage('index');
        return;
    }
    
    try {
        const response = await fetch(API_BASE + "/queueStatus?userId=" + userId);
        
        // Check if the user was not found (404) - they've been removed from queue
        if (response.status === 404) {
            // User not found in queue (kicked or removed by cleanup)
            console.log('User not found in queue - session expired');
            resetUserState();
            loadPage('index');
            return;
        }
        
        if (!response.ok) {
            // Other API error, just log it
            console.error('API error checking status:', response.status);
            return;
        }
        
        const data = await response.json();
        
        // Check if the response indicates user not found
        if (data.status === 'NOT_FOUND' || data.error === 'User not found' || data.message === 'User not found') {
            console.log('User removed from queue');
            resetUserState();
            loadPage('index');
            return;
        }
        
        // Update UI with status
        const positionEl = document.getElementById('position');
        const statusMsgEl = document.getElementById('status-message');
        const peopleAheadEl = document.getElementById('people-ahead');
        const waitTimeEl = document.getElementById('wait-time');
        const progressBar = document.getElementById('progress-bar');
        
        if (positionEl) positionEl.textContent = `#${data.position}`;
        if (statusMsgEl) statusMsgEl.textContent = `Status: ${data.status}`;
        if (peopleAheadEl) peopleAheadEl.textContent = data.position - 1;
        if (waitTimeEl) {
            const position = Number(data.position);

            if (Number.isNaN(position) || position <= 1) {
                waitTimeEl.textContent = "00:00";
            } else {
                const peopleAhead = position - 1;
                const totalSeconds = peopleAhead * 5 * 60;
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                waitTimeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        }
        
        // Update progress bar (inverse of position, capped at 20 for demo)
        if (progressBar) {
            const progress = Math.max(0, 100 - (data.position / 20) * 100);
            progressBar.style.width = `${progress}%`;
        }
        
        // If allowed, redirect to allowed page
        if (data.status === 'ALLOWED') {
            clearInterval(pollingInterval);
            window.location.href = 'allowed.html';
        }
        
    } catch (error) {
        console.error('Error checking queue status:', error);
        // On network error, don't immediately kick user - wait for next poll
    }
}

// Start countdown timer for allowed page
function startCountdown() {
    // Reset countdown seconds
    countdownSeconds = 300;
    
    // Update countdown display immediately
    updateCountdownDisplay();
    
    // Clear any existing timer
    if (countdownTimer) {
        clearInterval(countdownTimer);
    }
    
    // Start new countdown timer
    countdownTimer = setInterval(() => {
        countdownSeconds--;
        updateCountdownDisplay();
        
        // If countdown reaches 0, redirect back to index
        if (countdownSeconds <= 0) {
            clearInterval(countdownTimer);
            alert("Your time to purchase has expired. Please join the queue again.");
            localStorage.removeItem("userId");
            loadPage('index');
        }
    }, 1000);
}

// Update countdown display
function updateCountdownDisplay() {
    const countdownEl = document.getElementById('countdown');
    if (countdownEl) {
        const minutes = Math.floor(countdownSeconds / 60);
        const seconds = countdownSeconds % 60;
        countdownEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}
// Handle browser back/forward buttons
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.page) {
        loadPage(event.state.page);
    } else {
        loadPage('index');
    }
});

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);