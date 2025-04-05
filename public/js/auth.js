// public/js/auth.js
let translations = {};

const loadTranslations = async lang => {
  try {
    const response = await fetch(`/api/translations/${lang}`);
    translations = await response.json();
    applyTranslations();
  } catch (error) {
    console.error('Error loading translations:', error);
  }
};

const applyTranslations = () => {
  document.querySelectorAll('[data-key]').forEach(el => {
    const key = el.getAttribute('data-key');
    if (translations[key]) {
      if (el.tagName === 'INPUT') {
        el.placeholder = translations[key];
      } else if (el.tagName === 'BUTTON' || el.tagName === 'A') {
        el.textContent = translations[key];
      } else {
        el.textContent = translations[key];
      }
    }
  });
  document.title = translations[document.querySelector('title').getAttribute('data-key')] || document.title;
};

const showNotification = (message, isError = false) => {
  const notification = document.getElementById('notification');
  if (notification) {
    notification.textContent = translations[message] || message;
    notification.style.background = isError ? '#e74c3c' : '#f7931a';
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3000);
  }
};

const login = async () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.status === 'logged_in') {
      window.location.href = 'index.html';
    } else {
      showNotification('login_failed', true);
    }
  } catch (error) {
    console.error('Login error:', error);
    showNotification('login_failed', true);
  }
};

const register = async () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (password !== confirmPassword) {
    showNotification('password_mismatch', true);
    return;
  }

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.status === 'registered') {
      showNotification('register_success');
      setTimeout(() => window.location.href = 'login.html', 2000);
    } else {
      showNotification('register_failed', true);
    }
  } catch (error) {
    console.error('Register error:', error);
    showNotification('register_failed', true);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  loadTranslations('th'); // เริ่มต้นด้วยภาษาไทย
});