// public/js/ui.js
let chart;
let translations = {};
let currentLang = 'en';
let isLoggedIn = false;

function loadTranslations(lang) {
  fetch(`/api/translations/${lang}`)
    .then(response => response.json())
    .then(data => {
      translations = data;
      applyTranslations();
    })
    .catch(error => console.error('Error loading translations:', error));
}

function applyTranslations() {
  document.querySelectorAll('[data-key]').forEach(element => {
    const key = element.getAttribute('data-key');
    if (translations[key]) {
      if (element.tagName === 'BUTTON') {
        element.textContent = translations[key];
      } else {
        const span = element.querySelector('span');
        element.innerHTML = translations[key] + (span ? ` <span id="${span.id}">${span.textContent}</span>` : '');
      }
    }
  });
  document.title = translations.title || 'Bitcoin Mining Simulator';
  updateMissions();
}

function changeLanguage(lang) {
  currentLang = lang;
  loadTranslations(lang);
}

function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  document.querySelector(`button[onclick="showTab('${tabId}')"]`).classList.add('active');
  if (tabId === 'missions') updateMissions();
}

function showNotification(message) {
  const notification = document.getElementById('notification');
  if (notification) {
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3000);
  }
}

function updateStats() {
  if (!isLoggedIn) return;

  fetch('/api/stats')
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      if (data.status === 'not_logged_in') {
        isLoggedIn = false;
        window.location.href = 'login.html';
        return;
      }

      isLoggedIn = true;
      const elements = {
        usernameDisplay: `User: ${data.username}`,
        level: data.level,
        exp: data.exp,
        expNeeded: data.level * 100,
        hashRate: data.hashRate,
        powerConsumption: data.powerConsumption,
        totalPowerUsed: data.totalPowerUsed,
        bitcoinMined: data.bitcoinMined,
        blocksMined: data.blocksMined,
        blockReward: data.blockReward,
        wallet: data.wallet,
        btcPrice: data.btcPrice,
        difficulty: data.difficulty,
        energyType: data.energyType,
        solarPower: data.solarPower,
        temp: data.temp,
        gpuLevel: data.gpuLevel,
        tradeBtcPrice: data.btcPrice,
        tradeBitcoinMined: data.bitcoinMined,
        tradeWallet: data.wallet
      };

      for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
          element.textContent = value;
        } else {
          console.warn(`Element with ID '${id}' not found in DOM`);
        }
      }

      updateMiningLog(data.miningLog);
      updateChart(data.history);
      updateShopButtons(data.purchases);

      const startBtn = document.querySelector('.start-btn');
      const stopBtn = document.querySelector('.stop-btn');
      if (startBtn) startBtn.disabled = data.isMining;
      if (stopBtn) stopBtn.disabled = !data.isMining;
    })
    .catch(error => {
      console.error('Error fetching stats:', error);
      if (error.message.includes('401')) {
        isLoggedIn = false;
        window.location.href = 'login.html';
      } else {
        showNotification(translations.stats_failed || 'Failed to update stats');
      }
    });
}

function updateMiningLog(log) {
  const logDiv = document.getElementById('miningLog');
  if (logDiv) {
    logDiv.innerHTML = log.map(entry => `<p>${entry}</p>`).join('');
  }
}

function updateShopButtons(purchases) {
  const shopItems = {
    basicRig: '#basicRig button',
    advancedRig: '#advancedRig button',
    proRig: '#proRig button',
    solar: '#solar button'
  };
  for (const [key, selector] of Object.entries(shopItems)) {
    if (purchases[key]) {
      const button = document.querySelector(selector);
      if (button) button.textContent = translations.purchased || 'Purchased';
    }
  }
}

function updateChart(history) {
  const ctx = document.getElementById('miningChart')?.getContext('2d');
  if (!ctx) return;

  if (!chart) {
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          { label: translations.bitcoin_mined || 'BTC Mined', data: [], borderColor: '#f7931a', fill: false },
          { label: translations.btc_price || 'BTC Price ($)', data: [], borderColor: '#3498db', fill: false }
        ]
      },
      options: { scales: { y: { beginAtZero: false } } }
    });
  }
  chart.data.labels = history.map(h => h.time);
  chart.data.datasets[0].data = history.map(h => h.btcMined);
  chart.data.datasets[1].data = history.map(h => h.btcPrice);
  chart.update();
}

function updateMissions() {
  if (!isLoggedIn) return;

  fetch('/api/stats')
    .then(response => response.json())
    .then(data => {
      if (data.status === 'not_logged_in') return;
      const missionsList = document.getElementById('missions-list');
      if (missionsList) {
        missionsList.innerHTML = '';
        data.missions.forEach(mission => {
          const div = document.createElement('div');
          div.className = 'mission-item';
          div.innerHTML = `
            <p>${translations.mission}: ${translations[mission.desc] || mission.desc}</p>
            <p>${translations.progress}: ${mission.progress}/${mission.target}</p>
            <p>${translations.reward}: $${mission.reward}</p>
            <p>${translations.status}: ${mission.completed ? translations.completed : translations.in_progress}</p>
          `;
          missionsList.appendChild(div);
        });
      }
    })
    .catch(error => console.error('Error updating missions:', error));
}

// รอให้ DOM โหลดเสร็จก่อนเริ่มการทำงาน
document.addEventListener('DOMContentLoaded', () => {
  loadTranslations('en');
  let statsInterval = null;

  // ตรวจสอบสถานะการล็อกอินเมื่อโหลดหน้า
  fetch('/api/stats')
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      if (data.status === 'not_logged_in') {
        isLoggedIn = false;
        window.location.href = 'login.html';
      } else {
        isLoggedIn = true;
        updateStats();
        statsInterval = setInterval(() => {
          if (isLoggedIn) updateStats();
        }, 1000);
      }
    })
    .catch(error => {
      console.error('Initial stats check failed:', error);
      isLoggedIn = false;
      window.location.href = 'login.html';
    });

  // หยุด interval เมื่อออกจากหน้า
  window.addEventListener('unload', () => {
    if (statsInterval) clearInterval(statsInterval);
  });
});