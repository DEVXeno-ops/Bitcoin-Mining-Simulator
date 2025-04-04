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
    this.isMining = true;
    return { status: 'mining_started' };
  }

  stopMining() {
    this.isMining = false;
    return { status: 'mining_stopped' };
  }

  upgradeRig(newHashRate, additionalPower, cost) {
    if (this.wallet < cost) return { status: 'insufficient_funds' };
    this.hashRate = newHashRate;
    this.powerConsumption += additionalPower;
    this.wallet -= cost;
    return { status: 'rig_upgraded', hashRate: this.hashRate, power: this.powerConsumption };
  }

  simulateMining() { // ฟังก์ชันนี้ต้องมีอยู่
    if (!this.isMining) return;

    for (let i = 0; i < this.hashRate; i++) {
      const header = this.createBlockHeader(this.nonce.toString(16));
      const hash = this.calculateHash(header);
      if (hash < this.difficulty) {
        this.bitcoinMined += this.blockReward;
        this.blocksMined++;
        this.nonce = 0;
        console.log(`✅ Block mined! Reward: ${this.blockReward} BTC`);
      }
      this.nonce++;
    }

    this.totalPowerUsed += this.powerConsumption / 3600;
    this.wallet -= (this.powerConsumption / 3600) * this.electricityCostPerKWh;
    this.btcPrice *= (1 + (Math.random() * 0.1 - 0.05));

    if (this.blocksMined % 50 === 0 && this.blocksMined > 0) {
      this.blockReward /= 2;
      console.log(`⚠️ Halving occurred! New block reward: ${this.blockReward} BTC`);
    }

    this.history.push({
      time: new Date().toLocaleTimeString(),
      btcMined: this.bitcoinMined,
      btcPrice: this.btcPrice
    });
    if (this.history.length > 60) this.history.shift();
  }

  adjustDifficulty() {
    const difficultyFactor = this.bitcoinMined > 0 ? 1 + this.bitcoinMined * 0.1 : 1;
    this.difficulty = '0000' + Math.floor(parseInt('ffff', 16) / difficultyFactor).toString(16).padStart(4, 'f');
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
      history: this.history
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
      btcPrice: this.btcPrice
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
  const { hashRate, power, cost } = req.body;
  res.json(miner.upgradeRig(hashRate, power, cost));
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

// จำลองการขุดทุกวินาที
setInterval(() => {
  miner.simulateMining(); // เรียกฟังก์ชันนี้
  miner.adjustDifficulty();
}, 1000);

app.listen(3000, () => console.log('Server running on http://localhost:3000'));