// src/routes/api.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const BitcoinMiner = require('../models/BitcoinMiner');
const { startMining, stopMining, simulateMining } = require('../utils/mining');
const { upgradeRig, upgradeGPU, buySolar, tradeBTC } = require('../utils/shop');
const { saveGame, loadGame } = require('../utils/storage');

const router = express.Router();

// เก็บ miners และ currentUser ใน object เพื่อไม่ให้สูญหายระหว่างการรีเควส
const state = {
  miners: {},
  currentUser: null
};

router.use((req, res, next) => {
  fs.mkdirSync(path.join(__dirname, '../../data'), { recursive: true });
  next();
});

// Authentication Routes
router.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ status: 'missing_fields' });

  const usersFile = path.join(__dirname, '../../data/users.json');
  let users = {};
  if (fs.existsSync(usersFile) && fs.readFileSync(usersFile, 'utf8').trim() !== '') {
    users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  }

  if (users[username]) return res.json({ status: 'user_exists' });

  users[username] = { password: crypto.createHash('sha256').update(password).digest('hex') };
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  state.miners[username] = new BitcoinMiner(username);
  state.currentUser = username;
  res.json({ status: 'registered', username });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ status: 'missing_fields' });

  const usersFile = path.join(__dirname, '../../data/users.json');
  let users = {};
  if (fs.existsSync(usersFile) && fs.readFileSync(usersFile, 'utf8').trim() !== '') {
    users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  } else {
    return res.json({ status: 'no_users_found' });
  }

  const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
  if (!users[username] || users[username].password !== hashedPassword) {
    return res.json({ status: 'invalid_credentials' });
  }

  if (!state.miners[username]) state.miners[username] = new BitcoinMiner(username);
  state.currentUser = username;
  res.json({ status: 'logged_in', username });
});

router.post('/logout', (req, res) => {
  state.currentUser = null;
  res.json({ status: 'logged_out' });
});

// Game Routes
router.get('/stats', (req, res) => {
  if (!state.currentUser) {
    return res.status(401).json({ status: 'not_logged_in' });
  }
  try {
    const stats = state.miners[state.currentUser].getStats();
    res.json(stats);
  } catch (error) {
    console.error(`Error fetching stats for ${state.currentUser}:`, error);
    res.status(500).json({ status: 'stats_failed', error: error.message });
  }
});

router.post('/start', (req, res) => {
  if (!state.currentUser) return res.status(401).json({ status: 'not_logged_in' });
  try {
    res.json(startMining(state.miners[state.currentUser]));
  } catch (error) {
    console.error(`Error starting mining for ${state.currentUser}:`, error);
    res.status(500).json({ status: 'start_failed', error: error.message });
  }
});

router.post('/stop', (req, res) => {
  if (!state.currentUser) return res.status(401).json({ status: 'not_logged_in' });
  try {
    res.json(stopMining(state.miners[state.currentUser]));
  } catch (error) {
    console.error(`Error stopping mining for ${state.currentUser}:`, error);
    res.status(500).json({ status: 'stop_failed', error: error.message });
  }
});

router.post('/upgrade', (req, res) => {
  if (!state.currentUser) return res.status(401).json({ status: 'not_logged_in' });
  const { hashRate, power, cost, type } = req.body;
  if (!hashRate || !power || !cost || !type) return res.status(400).json({ status: 'missing_fields' });
  res.json(upgradeRig(state.miners[state.currentUser], hashRate, power, cost, type));
});

router.post('/upgrade-gpu', (req, res) => {
  if (!state.currentUser) return res.status(401).json({ status: 'not_logged_in' });
  const { level, cost } = req.body;
  if (!level || !cost) return res.status(400).json({ status: 'missing_fields' });
  res.json(upgradeGPU(state.miners[state.currentUser], level, cost));
});

router.post('/buy-solar', (req, res) => {
  if (!state.currentUser) return res.status(401).json({ status: 'not_logged_in' });
  const { power, cost } = req.body;
  if (!power || !cost) return res.status(400).json({ status: 'missing_fields' });
  res.json(buySolar(state.miners[state.currentUser], power, cost));
});

router.post('/trade', (req, res) => {
  if (!state.currentUser) return res.status(401).json({ status: 'not_logged_in' });
  const { amount, action } = req.body;
  if (!amount || !action) return res.status(400).json({ status: 'missing_fields' });
  res.json(tradeBTC(state.miners[state.currentUser], amount, action));
});

router.post('/save', (req, res) => {
  if (!state.currentUser) return res.status(401).json({ status: 'not_logged_in' });
  res.json(saveGame(state.miners[state.currentUser]));
});

router.post('/load', (req, res) => {
  if (!state.currentUser) return res.status(401).json({ status: 'not_logged_in' });
  res.json(loadGame(state.miners[state.currentUser]));
});

router.get('/translations/:lang', (req, res) => {
  const lang = req.params.lang;
  const filePath = path.join(__dirname, '../../public/translations', `${lang}.json`);
  if (fs.existsSync(filePath)) res.sendFile(filePath);
  else res.status(404).json({ error: 'Language not found' });
});

// Simulation Loop
setInterval(() => {
  for (const username in state.miners) {
    try {
      simulateMining(state.miners[username]);
      state.miners[username].adjustDifficulty();
    } catch (error) {
      console.error(`Error in simulation for ${username}:`, error);
    }
  }
}, 1000);

module.exports = router;