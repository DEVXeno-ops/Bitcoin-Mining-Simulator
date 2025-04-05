// src/models/BitcoinMiner.js
const crypto = require('crypto');

class BitcoinMiner {
  constructor(username) {
    this.username = username;
    this.stats = {
      hashRate: 1000,           // เริ่มต้นต่ำเพื่อให้ท้าทาย
      powerConsumption: 0.5,    // kW
      totalPowerUsed: 0,        // kWh
      bitcoinMined: 0,
      blocksMined: 0,
      blockReward: 3.125,       // ลดรางวัลเริ่มต้น
      wallet: 500,              // เงินเริ่มต้นน้อยลง
      btcPrice: 60000,
      difficulty: '0000ffff',   // ความยากเริ่มต้น
      solarPower: 0,
      windPower: 0,
      nuclearPower: 0,
      level: 1,
      exp: 0,
      temp: 25,                 // อุณหภูมิเริ่มต้น (°C)
      gpuLevel: 1,
      coolingLevel: 1,          // ระดับการระบายความร้อน
      energyCost: 0.15          // ราคาไฟต่อ kWh
    };
    this.state = {
      isMining: false,
      nonce: 0,
      energyType: 'grid',
      coolingActive: false,
      marketDemand: 50          // ความต้องการ BTC ในตลาด (0-100)
    };
    this.history = [];
    this.missions = [
      { id: 1, desc: 'mine_1_btc', reward: 1000, progress: 0, target: 1, completed: false },
      { id: 2, desc: 'mine_10_blocks', reward: 2000, progress: 0, target: 10, completed: false },
      { id: 3, desc: 'reach_level_5', reward: 5000, progress: 0, target: 5, completed: false }
    ];
    this.purchases = {
      basicRig: false,
      advancedRig: false,
      proRig: false,
      solar: false,
      wind: false,
      nuclear: false,
      fan: false,
      waterCooling: false
    };
    this.miningLog = [];
  }

  createBlockHeader(nonce) {
    const version = '1';
    const prevBlockHash = crypto.randomBytes(32).toString('hex');
    const merkleRoot = crypto.randomBytes(32).toString('hex');
    const timestamp = Math.floor(Date.now() / 1000).toString(16);
    const bits = this.stats.difficulty;
    return `${version}${prevBlockHash}${merkleRoot}${timestamp}${bits}${nonce}`;
  }

  calculateHash(header) {
    return crypto.createHash('sha256')
      .update(crypto.createHash('sha256').update(header).digest())
      .digest('hex');
  }

  checkLevelUp() {
    const expNeeded = this.stats.level * 200; // EXP ยากขึ้น
    if (this.stats.exp >= expNeeded) {
      this.stats.level++;
      this.stats.exp -= expNeeded;
      this.stats.hashRate += this.stats.level * 50;
      this.stats.powerConsumption += 0.1;
    }
  }

  updateMissions() {
    this.missions.forEach(mission => {
      if (!mission.completed) {
        mission.progress = mission.id === 1 ? this.stats.bitcoinMined :
                         mission.id === 2 ? this.stats.blocksMined :
                         this.stats.level;
        if (mission.progress >= mission.target) {
          mission.completed = true;
          this.stats.wallet += mission.reward;
          this.miningLog.push(`Mission ${mission.desc} completed! Reward: $${mission.reward}`);
        }
      }
    });
  }

  adjustDifficulty() {
    const baseDifficulty = parseInt('ffff', 16);
    const factor = 1 + (this.stats.blocksMined * 0.05 + this.stats.level * 0.1);
    this.stats.difficulty = '0000' + Math.floor(baseDifficulty / factor).toString(16).padStart(4, '0');
  }

  updateMarket() {
    this.state.marketDemand += Math.random() * 10 - 5; // ความผันผวน ±5%
    this.state.marketDemand = Math.max(10, Math.min(90, this.state.marketDemand));
    this.stats.btcPrice = 50000 + (this.state.marketDemand - 50) * 200; // ราคา BTC ผันผวนตาม demand
  }

  getStats() {
    return {
      username: this.username,
      ...this.stats,
      isMining: this.state.isMining,
      history: this.history,
      energyType: this.state.energyType,
      coolingActive: this.state.coolingActive,
      marketDemand: this.state.marketDemand,
      missions: this.missions,
      purchases: this.purchases,
      miningLog: this.miningLog.slice(-5) // จำกัด log 5 รายการ
    };
  }
}

module.exports = BitcoinMiner;