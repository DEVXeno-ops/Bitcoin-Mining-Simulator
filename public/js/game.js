// public/js/game.js
function startMining() {
    fetch('/api/start', { method: 'POST' })
      .then(response => response.json())
      .then(data => {
        showNotification(data.status === 'mining_started' ? translations.mining_started : translations[data.status]);
        updateStats();
      })
      .catch(error => {
        console.error('Error starting mining:', error);
        showNotification('Error starting mining');
      });
  }
  
  function stopMining() {
    fetch('/api/stop', { method: 'POST' })
      .then(response => response.json())
      .then(data => {
        showNotification(data.status === 'mining_stopped' ? translations.mining_stopped : 'Failed to stop mining');
        updateStats();
      })
      .catch(error => {
        console.error('Error stopping mining:', error);
        showNotification('Error stopping mining');
      });
  }
  
  function upgradeRig(hashRate, power, cost, type) {
    fetch('/api/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hashRate, power, cost, type })
    })
    .then(response => response.json())
    .then(data => {
      showNotification(translations[data.status] || 'Failed to upgrade rig');
      updateStats();
    })
    .catch(error => {
      console.error('Error upgrading rig:', error);
      showNotification('Error upgrading rig');
    });
  }
  
  function upgradeGPU(level, cost) {
    fetch('/api/upgrade-gpu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, cost })
    })
    .then(response => response.json())
    .then(data => {
      showNotification(translations[data.status] || 'Failed to upgrade GPU');
      updateStats();
    })
    .catch(error => {
      console.error('Error upgrading GPU:', error);
      showNotification('Error upgrading GPU');
    });
  }
  
  function buySolar(power, cost) {
    fetch('/api/buy-solar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ power, cost })
    })
    .then(response => response.json())
    .then(data => {
      showNotification(translations[data.status] || 'Failed to buy solar');
      updateStats();
    })
    .catch(error => {
      console.error('Error buying solar:', error);
      showNotification('Error buying solar');
    });
  }
  
  function tradeBTC(action) {
    const amount = parseFloat(document.getElementById('tradeAmount').value);
    if (!amount || amount <= 0) return showNotification(translations.invalid_amount);
    fetch('/api/trade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, action })
    })
    .then(response => response.json())
    .then(data => {
      showNotification(translations[data.status] || 'Failed to trade BTC');
      updateStats();
    })
    .catch(error => {
      console.error('Error trading BTC:', error);
      showNotification('Error trading BTC');
    });
  }
  
  function saveGame() {
    fetch('/api/save', { method: 'POST' })
      .then(response => response.json())
      .then(data => {
        showNotification(translations[data.status] || 'Error saving game');
      })
      .catch(error => {
        console.error('Error saving game:', error);
        showNotification('Error saving game');
      });
  }
  
  function loadGame() {
    fetch('/api/load', { method: 'POST' })
      .then(response => response.json())
      .then(data => {
        showNotification(translations[data.status] || 'Error loading game');
        updateStats();
      })
      .catch(error => {
        console.error('Error loading game:', error);
        showNotification('Error loading game');
      });
  }
  
  function logout() {
    fetch('/api/logout', { method: 'POST' })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'logged_out') window.location.href = 'login.html';
      })
      .catch(error => {
        console.error('Error logging out:', error);
        showNotification('Error logging out');
      });
  }