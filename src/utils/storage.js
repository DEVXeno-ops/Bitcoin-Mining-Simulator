// src/utils/storage.js
const fs = require('fs');
const path = require('path');

function saveGame(miner) {
  const data = {
    hashRate: miner.hashRate,
    powerConsumption: miner.powerConsumption,
    totalPowerUsed: miner.totalPowerUsed,
    bitcoinMined: miner.bitcoinMined,
    blocksMined: miner.blocksMined,
    blockReward: miner.blockReward,
    wallet: miner.wallet,
    btcPrice: miner.btcPrice,
    solarPower: miner.solarPower,
    energyType: miner.energyType,
    level: miner.level,
    exp: miner.exp,
    temp: miner.temp,
    gpuLevel: miner.gpuLevel,
    missions: miner.missions,
    purchases: miner.purchases
  };
  const saveDir = path.join(__dirname, '../../data/saves');
  fs.mkdirSync(saveDir, { recursive: true });
  try {
    fs.writeFileSync(path.join(saveDir, `${miner.username}.json`), JSON.stringify(data, null, 2));
    return { status: 'game_saved' };
  } catch (error) {
    console.error(`Error saving game for ${miner.username}:`, error);
    return { status: 'save_failed' };
  }
}

function loadGame(miner) {
  const saveFile = path.join(__dirname, '../../data/saves', `${miner.username}.json`);
  if (!fs.existsSync(saveFile) || fs.readFileSync(saveFile, 'utf8').trim() === '') {
    return { status: 'no_save_found' };
  }
  try {
    const data = JSON.parse(fs.readFileSync(saveFile, 'utf8'));
    miner.hashRate = data.hashRate || 1000;
    miner.powerConsumption = data.powerConsumption || 0.1;
    miner.totalPowerUsed = data.totalPowerUsed || 0;
    miner.bitcoinMined = data.bitcoinMined || 0;
    miner.blocksMined = data.blocksMined || 0;
    miner.blockReward = data.blockReward || 6.25;
    miner.wallet = data.wallet || 1000;
    miner.btcPrice = data.btcPrice || 60000;
    miner.solarPower = data.solarPower || 0;
    miner.energyType = data.energyType || 'grid';
    miner.level = data.level || 1;
    miner.exp = data.exp || 0;
    miner.temp = data.temp || 20;
    miner.gpuLevel = data.gpuLevel || 1;
    miner.missions = data.missions || miner.missions;
    miner.purchases = data.purchases || { basicRig: false, advancedRig: false, proRig: false, solar: false };
    return { status: 'game_loaded' };
  } catch (error) {
    console.error(`Error loading game for ${miner.username}:`, error);
    return { status: 'load_failed' };
  }
}

module.exports = { saveGame, loadGame };