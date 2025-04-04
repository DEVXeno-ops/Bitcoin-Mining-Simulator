// src/models/BitcoinMiner.js
const crypto = require('crypto');

class BitcoinMiner {
  constructor(username) {
    this.username = username;
    this.hashRate = 1000;
    this.powerConsumption = 0.1;
    this.totalPowerUsed = 0;
    this.bitcoinMined = 0;
    this.blocksMined = 0;
    this.blockReward = 6.25;
    this.difficulty = '0000ffff';
    this.isMining = false;
    this.electricityCostPerKWh = parseFloat(process.env.ELECTRICITY_COST) || 0.12;
    this.wallet = 1000;
    this.btcPrice = 60000;
    this.nonce = 0;
    this.history = [];
    this.energyType = 'grid';
    this.solarPower = 0;
    this.level = 1;
    this.exp = 0;
    this.temp = 20;
    this.gpuLevel = 1;
    this.missions = [
      { id: 1, desc: 'Mine 1 BTC', reward: 500, progress: 0, target: 1, completed: false },
      { id: 2, desc: 'Mine 5 blocks', reward: 1000, progress: 0, target: 5, completed: false }
    ];
    this.purchases = { basicRig: false, advancedRig: false, proRig: false, solar: false };
    this.miningLog = [];
  }

  createBlockHeader(nonce) {
    const version = '1';
    const prevBlockHash = crypto.randomBytes(32).toString('hex');
    const merkleRoot = crypto.randomBytes(32).toString('hex');
    const timestamp = Math.floor(Date.now() / 1000).toString(16);
    const bits = '1d00ffff';
    return `${version}${prevBlockHash}${merkleRoot}${timestamp}${bits}${nonce}`;
  }

  calculateHash(header) {
    return crypto.createHash('sha256').update(
      crypto.createHash('sha256').update(header).digest()
    ).digest('hex');
  }

  checkLevelUp() {
    const expNeeded = this.level * 100;
    if (this.exp >= expNeeded) {
      this.level++;
      this.exp = 0;
      this.hashRate += 100;
    }
  }

  updateMissions() {
    this.missions.forEach(mission => {
      if (!mission.completed) {
        if (mission.id === 1) mission.progress = this.bitcoinMined;
        if (mission.id === 2) mission.progress = this.blocksMined;
        if (mission.progress >= mission.target) {
          mission.completed = true;
          this.wallet += mission.reward;
        }
      }
    });
  }

  adjustDifficulty() {
    const difficultyFactor = this.bitcoinMined > 0 ? 1 + this.bitcoinMined * 0.1 : 1;
    this.difficulty = '0000' + Math.floor(parseInt('ffff', 16) / difficultyFactor).toString(16).padStart(4, 'f');
  }

  getStats() {
    return {
      username: this.username,
      hashRate: this.hashRate,
      powerConsumption: this.powerConsumption,
      totalPowerUsed: this.totalPowerUsed.toFixed(4),
      bitcoinMined: this.bitcoinMined.toFixed(4),
      blocksMined: this.blocksMined,
      blockReward: this.blockReward.toFixed(4),
      wallet: this.wallet.toFixed(2),
      btcPrice: this.btcPrice.toFixed(2),
      difficulty: this.difficulty,
      isMining: this.isMining,
      history: this.history,
      energyType: this.energyType,
      solarPower: this.solarPower,
      level: this.level,
      exp: this.exp,
      temp: this.temp.toFixed(1),
      gpuLevel: this.gpuLevel,
      missions: this.missions,
      purchases: this.purchases,
      miningLog: this.miningLog
    };
  }
}

module.exports = BitcoinMiner;