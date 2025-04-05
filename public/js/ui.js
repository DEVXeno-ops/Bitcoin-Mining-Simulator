// public/js/ui.js
let chart;
let translations = {};
let currentLang = 'en';
let isLoggedIn = false;

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
      if (el.tagName === 'BUTTON' || el.tagName === 'INPUT') {
        el.textContent = translations[key];
      } else {
        const span = el.querySelector('span');
        el.innerHTML = translations[key] + (span ? ` <span id="${span.id}">${span.textContent}</span>` : '');
      }
    }
  });
  document.title = translations.title || 'Bitcoin Mining Simulator v0.1.0 Beta';
  updateMissions();
};

const changeLanguage = lang => loadTranslations(lang);

const showTab = tabId => {
  const tabElement = document.getElementById(tabId);
  if (!tabElement) {
    console.error(`Tab with ID "${tabId}" not found`);
    return;
  }

  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));

  tabElement.classList.add('active');

  const activeButton = document.querySelector(`button[onclick="showTab('${tabId}')"]`);
  if (activeButton) {
    activeButton.classList.add('active');
  } else {
    console.warn(`Button for tab "${tabId}" not found`);
  }

  if (tabId === 'missions') updateMissions();
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

const updateStats = async () => {
  if (!isLoggedIn) return;

  try {
    const response = await fetch('/api/stats');
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();

    if (data.status === 'not_logged_in') {
      isLoggedIn = false;
      window.location.href = 'login.html';
      return;
    }

    isLoggedIn = true;
    const elements = {
      usernameDisplay: `${translations.user}: ${data.username}`,
      level: data.level,
      exp: data.exp,
      expNeeded: data.level * 200,
      hashRate: `${data.hashRate} H/s`,
      powerConsumption: `${data.powerConsumption.toFixed(2)} kW`,
      totalPowerUsed: `${data.totalPowerUsed.toFixed(2)} kWh`,
      bitcoinMined: `${data.bitcoinMined.toFixed(6)} BTC`,
      blocksMined: data.blocksMined,
      blockReward: `${data.blockReward.toFixed(4)} BTC`,
      wallet: `$${data.wallet.toFixed(2)}`,
      btcPrice: `$${data.btcPrice.toFixed(2)}`,
      marketDemand: `${data.marketDemand.toFixed(1)}%`,
      difficulty: data.difficulty,
      energyType: translations[data.energyType] || data.energyType,
      solarPower: `${data.solarPower} kW`,
      windPower: `${data.windPower} kW`,
      nuclearPower: `${data.nuclearPower} kW`,
      temp: `${data.temp.toFixed(1)}°C`,
      gpuLevel: data.gpuLevel,
      coolingLevel: data.coolingLevel,
      tradeBtcPrice: `$${data.btcPrice.toFixed(2)}`,
      tradeBitcoinMined: `${data.bitcoinMined.toFixed(6)} BTC`,
      tradeWallet: `$${data.wallet.toFixed(2)}`
    };

    Object.entries(elements).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });

    const tempFill = document.querySelector('.temp-fill');
    if (tempFill) tempFill.style.width = `${Math.min(data.temp, 100)}%`;

    updateMiningLog(data.miningLog);
    updateChart(data.history);

    document.querySelector('.start-btn').disabled = data.isMining;
    document.querySelector('.stop-btn').disabled = !data.isMining;
    document.querySelector('.cooling-btn').textContent = data.coolingActive ? translations.cooling_off : translations.cooling_on;
  } catch (error) {
    console.error('Error fetching stats:', error);
    showNotification('stats_failed', true);
  }
};

const updateMiningLog = log => {
  const logDiv = document.getElementById('miningLog');
  if (logDiv) logDiv.innerHTML = log.map(entry => `<p>${translations[entry] || entry}</p>`).join('');
};

const updateChart = history => {
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
      options: { scales: { y: { beginAtZero: false } }, responsive: true }
    });
  }
  chart.data.labels = history.map(h => h.time);
  chart.data.datasets[0].data = history.map(h => h.btcMined);
  chart.data.datasets[1].data = history.map(h => h.btcPrice);
  chart.update();
};

const updateMissions = async () => {
  if (!isLoggedIn) return;

  try {
    const response = await fetch('/api/stats');
    const data = await response.json();
    if (data.status === 'not_logged_in') return;

    const missionsList = document.getElementById('missions-list');
    if (missionsList) {
      missionsList.innerHTML = data.missions.map(mission => `
        <div class="mission-item">
          <p>${translations.mission}: ${translations[mission.desc] || mission.desc}</p>
          <p>${translations.progress}: ${mission.progress}/${mission.target}</p>
          <p>${translations.reward}: $${mission.reward}</p>
          <p>${translations.status}: ${mission.completed ? translations.completed : translations.in_progress}</p>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error updating missions:', error);
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadTranslations('en');
  let statsInterval = null;

  try {
    const response = await fetch('/api/stats');
    const data = await response.json();
    if (data.status === 'not_logged_in') {
      isLoggedIn = false;
      window.location.href = 'login.html';
    } else {
      isLoggedIn = true;
      updateStats();
      statsInterval = setInterval(updateStats, 1000);
    }
  } catch (error) {
    isLoggedIn = false;
    window.location.href = 'login.html';
  }

  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      const args = btn.getAttribute('data-args')?.split(',') || [];
      if (typeof window[action] === 'function') {
        window[action](...args);
      } else {
        console.error(`Action "${action}" is not a function or not defined`);
        showNotification(`Action "${action}" not found`, true);
      }
    });
  });

  window.addEventListener('unload', () => {
    if (statsInterval) clearInterval(statsInterval);
  });
});