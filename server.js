const crypto = require('crypto');
const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class BitcoinMiner {
  constructor() {
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
    this.temp = 20; // อุณหภูมิ (°C)
    this.gpuLevel = 1; // ระดับการ์ดจอ
    this.missions = [
      { id: 1, desc: 'Mine 1 BTC', reward: 500, progress: 0, target: 1, completed: false },
      { id: 2, desc: 'Mine 5 blocks', reward: 1000, progress: 0, target: 5, completed: false }
    ];
    this.purchases = { basicRig: false, advancedRig: false, proRig: false, solar: false };
    this.miningLog = []; // บันทึกการขุด
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

  startMining() {
    if (this.isMining) return { status: 'already_mining' };
    if (this.temp >= 80) return { status: 'overheat' };
    this.isMining = true;
    return { status: 'mining_started' };
  }

  stopMining() {
    this.isMining = false;
    return { status: 'mining_stopped' };
  }

  upgradeRig(newHashRate, additionalPower, cost, type) {
    if (this.wallet < cost) return { status: 'insufficient_funds' };
    if (this.purchases[type]) return { status: 'already_purchased' };
    this.hashRate = newHashRate;
    this.powerConsumption += additionalPower;
    this.wallet -= cost;
    this.purchases[type] = true;
    return { status: 'rig_upgraded', hashRate: this.hashRate, power: this.powerConsumption };
  }

  upgradeGPU(level, cost) {
    if (this.wallet < cost) return { status: 'insufficient_funds' };
    this.gpuLevel = level;
    this.hashRate += level * 500; // เพิ่ม hash rate ตามระดับ GPU
    this.wallet -= cost;
    return { status: 'gpu_upgraded', gpuLevel: this.gpuLevel };
  }

  buySolar(power, cost) {
    if (this.wallet < cost) return { status: 'insufficient_funds' };
    if (this.purchases.solar) return { status: 'already_purchased' };
    this.solarPower += power;
    this.wallet -= cost;
    this.energyType = 'solar';
    this.purchases.solar = true;
    return { status: 'solar_bought', solarPower: this.solarPower };
  }

  tradeBTC(amount, action) {
    if (amount <= 0) return { status: 'invalid_amount' };
    if (action === 'buy') {
      const cost = amount * this.btcPrice;
      if (this.wallet < cost) return { status: 'insufficient_funds' };
      this.bitcoinMined += amount;
      this.wallet -= cost;
    } else if (action === 'sell') {
      if (this.bitcoinMined < amount) return { status: 'insufficient_btc' };
      this.bitcoinMined -= amount;
      this.wallet += amount * this.btcPrice;
    }
    return { status: 'trade_success' };
  }

  simulateMining() {
    if (!this.isMining) return;

    for (let i = 0; i < this.hashRate; i++) {
      const header = this.createBlockHeader(this.nonce.toString(16));
      const hash = this.calculateHash(header);
      if (hash < this.difficulty) {
        this.bitcoinMined += this.blockReward;
        this.blocksMined++;
        this.exp += 10;
        this.nonce = 0;
        this.miningLog.push(`Block mined! Reward: ${this.blockReward} BTC at ${new Date().toLocaleTimeString()}`);
        if (this.miningLog.length > 5) this.miningLog.shift();
        this.checkLevelUp();
      }
      this.nonce++;
    }

    const effectivePower = Math.max(this.powerConsumption - this.solarPower, 0);
    this.totalPowerUsed += effectivePower / 3600;
    this.wallet -= (effectivePower / 3600) * this.electricityCostPerKWh;
    this.btcPrice *= (1 + (Math.random() * 0.1 - 0.05) * (this.bitcoinMined / 10)); // จำลอง supply/demand
    this.temp += this.powerConsumption * 0.1; // ความร้อนเพิ่มตามการใช้พลังงาน
    if (this.temp >= 80) this.stopMining();

    if (this.blocksMined % 50 === 0 && this.blocksMined > 0) {
      this.blockReward /= 2;
    }

    this.history.push({
      time: new Date().toLocaleTimeString(),
      btcMined: this.bitcoinMined,
      btcPrice: this.btcPrice
    });
    if (this.history.length > 60) this.history.shift();

    this.updateMissions();
    if (this.temp > 20) this.temp -= 0.5; // คูลดาวน์
  }

  checkLevelUp() {
    const expNeeded = this.level * 100;
    if (this.exp >= expNeeded) {
      this.level++;
      this.exp = 0;
      this.hashRate += 100; // โบนัส hash rate
    }
  }

  adjustDifficulty() {
    const difficultyFactor = this.bitcoinMined > 0 ? 1 + this.bitcoinMined * 0.1 : 1;
    this.difficulty = '0000' + Math.floor(parseInt('ffff', 16) / difficultyFactor).toString(16).padStart(4, 'f');
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

  getStats() {
    return {
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

  saveGame() {
    const data = {
      hashRate: this.hashRate,
      powerConsumption: this.powerConsumption,
      totalPowerUsed: this.totalPowerUsed,
      bitcoinMined: this.bitcoinMined,
      blocksMined: this.blocksMined,
      blockReward: this.blockReward,
      wallet: this.wallet,
      btcPrice: this.btcPrice,
      solarPower: this.solarPower,
      energyType: this.energyType,
      level: this.level,
      exp: this.exp,
      temp: this.temp,
      gpuLevel: this.gpuLevel,
      missions: this.missions,
      purchases: this.purchases
    };
    fs.writeFileSync(path.join(__dirname, 'data', 'save.json'), JSON.stringify(data, null, 2));
    return { status: 'game_saved' };
  }

  loadGame() {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'save.json')));
      this.hashRate = data.hashRate || 1000;
      this.powerConsumption = data.powerConsumption || 0.1;
      this.totalPowerUsed = data.totalPowerUsed || 0;
      this.bitcoinMined = data.bitcoinMined || 0;
      this.blocksMined = data.blocksMined || 0;
      this.blockReward = data.blockReward || 6.25;
      this.wallet = data.wallet || 1000;
      this.btcPrice = data.btcPrice || 60000;
      this.solarPower = data.solarPower || 0;
      this.energyType = data.energyType || 'grid';
      this.level = data.level || 1;
      this.exp = data.exp || 0;
      this.temp = data.temp || 20;
      this.gpuLevel = data.gpuLevel || 1;
      this.missions = data.missions || this.missions;
      this.purchases = data.purchases || { basicRig: false, advancedRig: false, proRig: false, solar: false };
      return { status: 'game_loaded' };
    } catch (error) {
      return { status: 'no_save_found' };
    }
  }
}

const app = express();
const miner = new BitcoinMiner();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/stats', (req, res) => res.json(miner.getStats()));
app.post('/start', (req, res) => res.json(miner.startMining()));
app.post('/stop', (req, res) => res.json(miner.stopMining()));
app.post('/upgrade', (req, res) => {
  const { hashRate, power, cost, type } = req.body;
  res.json(miner.upgradeRig(hashRate, power, cost, type));
});
app.post('/upgrade-gpu', (req, res) => {
  const { level, cost } = req.body;
  res.json(miner.upgradeGPU(level, cost));
});
app.post('/buy-solar', (req, res) => {
  const { power, cost } = req.body;
  res.json(miner.buySolar(power, cost));
});
app.post('/trade', (req, res) => {
  const { amount, action } = req.body;
  res.json(miner.tradeBTC(amount, action));
});
app.post('/save', (req, res) => res.json(miner.saveGame()));
app.post('/load', (req, res) => res.json(miner.loadGame()));
app.get('/translations/:lang', (req, res) => {
  const lang = req.params.lang;
  const filePath = path.join(__dirname, 'public', 'translations', `${lang}.json`);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Language not found' });
  }
});

setInterval(() => {
  miner.simulateMining();
  miner.adjustDifficulty();
}, 1000);

app.listen(3000, () => console.log('Server running on http://localhost:3000'));