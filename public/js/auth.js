// public/js/auth.js
function showNotification(message) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.classList.add('show');
  setTimeout(() => notification.classList.remove('show'), 3000);
}

function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    showNotification('Please fill in all fields');
    return;
  }

  fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.status === 'logged_in') {
      showNotification('Login successful!');
      setTimeout(() => window.location.href = 'index.html', 1000);
    } else {
      showNotification(data.status === 'invalid_credentials' ? 'Invalid credentials' : 'Login failed');
    }
  })
  .catch(error => {
    console.error('Login error:', error);
    showNotification('An error occurred');
  });
}

function register() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    showNotification('Please fill in all fields');
    return;
  }

  fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.status === 'registered') {
      showNotification('Registration successful!');
      setTimeout(() => window.location.href = 'index.html', 1000);
    } else {
      showNotification(data.status === 'user_exists' ? 'Username exists' : 'Registration failed');
    }
  })
  .catch(error => {
    console.error('Register error:', error);
    showNotification('An error occurred');
  });
}