// DOM Elements
const userEntryScreen = document.getElementById('user-entry');
const roomSelectionScreen = document.getElementById('room-selection');
const chatScreen = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username');
const roomNameInput = document.getElementById('room-name');
const joinRoomBtn = document.getElementById('join-room');
const backButton = document.getElementById('back-to-rooms');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-message');
const chatMessages = document.getElementById('messages');
const displayUsername = document.getElementById('display-username');
const editNameBtn = document.getElementById('edit-name');
const startChatBtn = document.getElementById('start-chat');
const shareRoomBtn = document.getElementById('share-room');
const randomRoomBtn = document.getElementById('random-room');

// State variables
let currentUser = '';
let currentRoom = '';
let lastTap = 0;
let messagesRef = null;
let usersRef = null;

// Initialize app
function initApp() {
    // Check if username exists in localStorage
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
        currentUser = savedUsername;
        usernameInput.value = savedUsername;
        showRoomSelection();
    } else {
        showUserEntry();
    }

    // Initialize button states
    joinRoomBtn.disabled = true;

    // Add event listeners
    usernameInput.addEventListener('input', handleUsernameInput);
    roomNameInput.addEventListener('input', handleRoomNameInput);
    joinRoomBtn.addEventListener('click', handleJoinRoom);
    backButton.addEventListener('click', handleBack);
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', handleMessageKeyPress);
    editNameBtn.addEventListener('click', handleEditName);
    startChatBtn.addEventListener('click', handleStartChat);
    shareRoomBtn.addEventListener('click', handleShareRoom);
    randomRoomBtn.addEventListener('click', handleRandomRoom);

    // Prevent double-tap zoom
    document.addEventListener('touchend', function(event) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 500 && tapLength > 0) {
            event.preventDefault();
        }
        lastTap = currentTime;
    });

    // Prevent pinch zoom
    document.addEventListener('gesturestart', function(event) {
        event.preventDefault();
    });
}

// Handle start chat button
function handleStartChat() {
    const username = usernameInput.value.trim();
    if (username) {
        currentUser = username;
        localStorage.setItem('username', username);
        displayUsername.textContent = username;
        showRoomSelection();
    }
}

// Handle username input
function handleUsernameInput() {
    const username = usernameInput.value.trim();
    if (username) {
        currentUser = username;
        localStorage.setItem('username', username);
        displayUsername.textContent = username;
    }
}

// Handle room name input
function handleRoomNameInput() {
    const roomName = roomNameInput.value.trim();
    joinRoomBtn.disabled = !roomName;
}

// Handle join room
function handleJoinRoom() {
    const roomName = roomNameInput.value.trim();
    if (roomName) {
        currentRoom = roomName;
        document.getElementById('current-room').textContent = roomName;
        showChat();
        setupRoomListeners();
    }
}

// Setup room listeners
function setupRoomListeners() {
    // Clear previous messages
    chatMessages.innerHTML = '';
    
    // Reference to messages in current room
    messagesRef = database.ref(`rooms/${currentRoom}/messages`);
    
    // Listen for new messages
    messagesRef.on('child_added', (snapshot) => {
        const message = snapshot.val();
        displayMessage(message);
    });

    // Update online count
    const userStatusRef = database.ref(`rooms/${currentRoom}/users/${currentUser}`);
    userStatusRef.set(true);
    userStatusRef.onDisconnect().remove();

    // Listen for online users
    usersRef = database.ref(`rooms/${currentRoom}/users`);
    usersRef.on('value', (snapshot) => {
        const users = snapshot.val();
        const count = users ? Object.keys(users).length : 0;
        document.getElementById('online-count').textContent = count;
    });
}

// Display message
function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.user === currentUser ? 'sent' : 'received'}`;
    messageElement.innerHTML = `
        <div class="username">${message.user}</div>
        <div class="text">${message.text}</div>
        <div class="timestamp">${formatTime(message.timestamp)}</div>
    `;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Format timestamp
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Handle back button
function handleBack() {
    if (currentRoom) {
        // Remove user from room
        if (messagesRef) {
            database.ref(`rooms/${currentRoom}/users/${currentUser}`).remove();
            messagesRef.off();
            if (usersRef) {
                usersRef.off();
            }
        }
        showRoomSelection();
    } else {
        showUserEntry();
    }
}

// Handle edit name
function handleEditName() {
    showUserEntry();
}

// Show user entry screen
function showUserEntry() {
    userEntryScreen.style.display = 'block';
    roomSelectionScreen.style.display = 'none';
    chatScreen.style.display = 'none';
}

// Show room selection screen
function showRoomSelection() {
    userEntryScreen.style.display = 'none';
    roomSelectionScreen.style.display = 'block';
    chatScreen.style.display = 'none';
    displayUsername.textContent = currentUser;
}

// Show chat screen
function showChat() {
    userEntryScreen.style.display = 'none';
    roomSelectionScreen.style.display = 'none';
    chatScreen.style.display = 'block';
}

// Handle message key press
function handleMessageKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Send message
function sendMessage() {
    const message = messageInput.value.trim();
    if (message && messagesRef) {
        const messageData = {
            text: message,
            user: currentUser,
            timestamp: Date.now()
        };

        // Push message to Firebase
        messagesRef.push(messageData).catch(error => {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        });

        // Clear input
        messageInput.value = '';
    }
}

// Handle share room
async function handleShareRoom() {
    const roomName = roomNameInput.value.trim();
    const shareData = {
        title: '💬 Hey! I am chatting on Quick Chat. Join my room now and lets talk!',
        text: roomName ? `Join my QuickChat room: ${roomName}` : 'Join me on Quick Chat!',
        url: 'https://play.google.com/store/apps/details?id=com.gmail.dhruvgour97.electricity&pcampaignid=web_share'
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            // Fallback for browsers that don't support Web Share API
            const shareUrl = roomName ? 
                `${window.location.origin}?room=${encodeURIComponent(roomName)}` : 
                window.location.origin;
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(shareUrl);
                // Only show alert if clipboard API is available
                alert('Room link copied to clipboard!');
            } else {
                // If clipboard API is not available, just share the URL directly
                window.open(shareUrl, '_blank');
            }
        }
    } catch (error) {
        if (error.name !== 'AbortError') {
            // If sharing fails, try to open the URL directly
            const shareUrl = roomName ? 
                `${window.location.origin}?room=${encodeURIComponent(roomName)}` : 
                window.location.origin;
            window.open(shareUrl, '_blank');
        }
    }
} 

// Handle random room
function handleRandomRoom() {
    // Get all rooms
    const roomsRef = database.ref('rooms');
    
    roomsRef.once('value', (snapshot) => {
        const rooms = snapshot.val();
        if (!rooms) {
            alert('No active rooms found. Create a new room!');
            return;
        }

        // Filter rooms with online users
        const activeRooms = Object.entries(rooms)
            .filter(([_, room]) => room.users && Object.keys(room.users).length > 0)
            .map(([roomName]) => roomName);

        if (activeRooms.length === 0) {
            alert('No active rooms found. Create a new room!');
            return;
        }

        // Select a random room
        const randomRoom = activeRooms[Math.floor(Math.random() * activeRooms.length)];
        
        // Join the random room
        currentRoom = randomRoom;
        document.getElementById('current-room').textContent = randomRoom;
        showChat();
        setupRoomListeners();
    });
}

// Initialize the app
initApp(); 
