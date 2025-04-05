// src/utils/shop.js
function upgradeRig(miner, newHashRate, additionalPower, cost, type) {
  if (miner.stats.wallet < cost) return { status: 'insufficient_funds' };
  if (miner.purchases[type]) return { status: 'already_purchased' };

  miner.stats.hashRate = newHashRate;
  miner.stats.powerConsumption += additionalPower;
  miner.stats.wallet -= cost;
  miner.purchases[type] = true;
  return { status: 'rig_upgraded', hashRate: miner.stats.hashRate };
}

function upgradeGPU(miner, level, cost) {
  if (miner.stats.wallet < cost) return { status: 'insufficient_funds' };
  miner.stats.gpuLevel = level;
  miner.stats.hashRate += level * 1000;
  miner.stats.powerConsumption += level * 0.2;
  miner.stats.wallet -= cost;
  return { status: 'gpu_upgraded', gpuLevel: miner.stats.gpuLevel };
}

function buyPower(miner, power, cost, type) {
  if (miner.stats.wallet < cost) return { status: 'insufficient_funds' };
  if (miner.purchases[type]) return { status: 'already_purchased' };

  miner.stats[`${type}Power`] += power;
  miner.stats.wallet -= cost;
  miner.purchases[type] = true;
  miner.state.energyType = type;
  return { status: `${type}_bought`, [`${type}Power`]: miner.stats[`${type}Power`] };
}

function upgradeCooling(miner, level, cost) {
  if (miner.stats.wallet < cost) return { status: 'insufficient_funds' };
  miner.stats.coolingLevel = level;
  miner.stats.wallet -= cost;
  miner.purchases[level === 2 ? 'fan' : 'waterCooling'] = true;
  return { status: 'cooling_upgraded', coolingLevel: miner.stats.coolingLevel };
}

function tradeBTC(miner, amount, action) {
  if (amount <= 0 || isNaN(amount)) return { status: 'invalid_amount' };
  if (action === 'buy') {
    const cost = amount * miner.stats.btcPrice * 1.05; // ค่าธรรมเนียม 5%
    if (miner.stats.wallet < cost) return { status: 'insufficient_funds' };
    miner.stats.bitcoinMined += amount;
    miner.stats.wallet -= cost;
    miner.state.marketDemand += amount * 0.1; // การซื้อเพิ่ม demand
  } else if (action === 'sell') {
    if (miner.stats.bitcoinMined < amount) return { status: 'insufficient_btc' };
    miner.stats.bitcoinMined -= amount;
    miner.stats.wallet += amount * miner.stats.btcPrice * 0.95; // ค่าธรรมเนียม 5%
    miner.state.marketDemand -= amount * 0.1; // การขายลด demand
  }
  return { status: 'trade_success' };
}

module.exports = { upgradeRig, upgradeGPU, buyPower, upgradeCooling, tradeBTC };