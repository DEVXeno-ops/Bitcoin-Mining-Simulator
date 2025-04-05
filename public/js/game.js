// public/js/game.js
const apiCall = async (endpoint, method = 'POST', body = null) => {
  try {
    const response = await fetch(`/api/${endpoint}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : null
    });
    const data = await response.json();
    showNotification(data.status, data.status.includes('failed') || data.status.includes('insufficient'));
    if (data.status !== 'stats_failed') updateStats();
    return data;
  } catch (error) {
    console.error(`Error in ${endpoint}:`, error);
    showNotification('stats_failed', true);
  }
};

// กำหนดฟังก์ชันทั้งหมดใน window object เพื่อให้ ui.js เรียกได้
window.startMining = () => apiCall('start');
window.stopMining = () => apiCall('stop');
window.toggleCooling = () => apiCall('cooling');
window.saveGame = () => apiCall('save');
window.loadGame = () => apiCall('load');
window.logout = () => apiCall('logout').then(data => {
  if (data.status === 'logged_out') window.location.href = 'login.html';
});

window.upgradeRig = (hashRate, power, cost, type) => 
  apiCall('upgrade', 'POST', { hashRate: parseInt(hashRate), power: parseFloat(power), cost: parseInt(cost), type });

window.upgradeGPU = (level, cost) => 
  apiCall('upgrade-gpu', 'POST', { level: parseInt(level), cost: parseInt(cost) });

window.buyPower = (power, cost, type) => 
  apiCall('buy-power', 'POST', { power: parseFloat(power), cost: parseInt(cost), type });

window.upgradeCooling = (level, cost) => 
  apiCall('upgrade-cooling', 'POST', { level: parseInt(level), cost: parseInt(cost) });

window.tradeBTC = (action) => {
  const amount = parseFloat(document.getElementById('tradeAmount')?.value);
  if (!amount || amount <= 0) return showNotification('invalid_amount', true);
  apiCall('trade', 'POST', { amount, action });
};