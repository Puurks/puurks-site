const webAppUrl = "https://script.google.com/macros/s/AKfycbyN2bzZM4XX2Ro_uCKX0FeuKvl8Q4Ed9LjemO4RZvoGg3I-8c6dz48Aryg5_Aay-i2i/exec";

const loginContainer = document.getElementById('login-container');
const chatContainer = document.getElementById('chat-container');
const usernameInput = document.getElementById('username');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const messageArea = document.getElementById('message-area');
const messageInput = document.getElementById('message');
const sendButton = document.getElementById('send-button');

let currentUser = null;

// Initialize app
function init() {
  currentUser = localStorage.getItem('current_user');
  if (currentUser) {
    showChatroom();
    fetchMessages();
  } else {
    showLogin();
  }
}

// Show login screen
function showLogin() {
  loginContainer.classList.remove('hidden');
  chatContainer.classList.add('hidden');
}

// Show chatroom
function showChatroom() {
  loginContainer.classList.add('hidden');
  chatContainer.classList.remove('hidden');
}

// Login logic
loginButton.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  if (username) {
    localStorage.setItem('current_user', username);
    currentUser = username;
    showChatroom();
    fetchMessages();
  }
});

// Logout logic
logoutButton.addEventListener('click', () => {
  localStorage.removeItem('current_user');
  currentUser = null;
  showLogin();
});

// Send message
sendButton.addEventListener('click', () => {
  const message = messageInput.value.trim();
  if (message) {
    postMessage(currentUser, message);
    messageInput.value = '';
  }
});

// Fetch messages from Google Sheets
async function fetchMessages() {
  try {
    const response = await fetch(webAppUrl);
    const messages = await response.json();
    renderMessages(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
  }
}

// Render messages in the chat area
function renderMessages(messages) {
  messageArea.innerHTML = '';
  messages.forEach(({ username, message, timestamp }) => {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = `${timestamp} - ${username}: ${message}`;
    messageArea.appendChild(messageDiv);
  });
}

// Post a message to Google Sheets
async function postMessage(username, message) {
  try {
    const response = await fetch(webAppUrl, {
      method: 'POST',
      body: JSON.stringify({ username, message }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.ok) {
      fetchMessages(); // Refresh messages after sending
    }
  } catch (error) {
    console.error("Error posting message:", error);
  }
}

// Initialize the app
init();
