// src/utils/shop.js
function upgradeRig(miner, newHashRate, additionalPower, cost, type) {
    if (miner.wallet < cost) return { status: 'insufficient_funds' };
    if (miner.purchases[type]) return { status: 'already_purchased' };
    miner.hashRate = newHashRate;
    miner.powerConsumption += additionalPower;
    miner.wallet -= cost;
    miner.purchases[type] = true;
    return { status: 'rig_upgraded', hashRate: miner.hashRate, power: miner.powerConsumption };
  }
  
  function upgradeGPU(miner, level, cost) {
    if (miner.wallet < cost) return { status: 'insufficient_funds' };
    miner.gpuLevel = level;
    miner.hashRate += level * 500;
    miner.wallet -= cost;
    return { status: 'gpu_upgraded', gpuLevel: miner.gpuLevel };
  }
  
  function buySolar(miner, power, cost) {
    if (miner.wallet < cost) return { status: 'insufficient_funds' };
    if (miner.purchases.solar) return { status: 'already_purchased' };
    miner.solarPower += power;
    miner.wallet -= cost;
    miner.energyType = 'solar';
    miner.purchases.solar = true;
    return { status: 'solar_bought', solarPower: miner.solarPower };
  }
  
  function tradeBTC(miner, amount, action) {
    if (amount <= 0 || isNaN(amount)) return { status: 'invalid_amount' };
    if (action === 'buy') {
      const cost = amount * miner.btcPrice;
      if (miner.wallet < cost) return { status: 'insufficient_funds' };
      miner.bitcoinMined += amount;
      miner.wallet -= cost;
    } else if (action === 'sell') {
      if (miner.bitcoinMined < amount) return { status: 'insufficient_btc' };
      miner.bitcoinMined -= amount;
      miner.wallet += amount * miner.btcPrice;
    }
    return { status: 'trade_success' };
  }
  
  module.exports = { upgradeRig, upgradeGPU, buySolar, tradeBTC };