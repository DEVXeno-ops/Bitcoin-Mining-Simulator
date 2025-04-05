// src/routes/api.js
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const BitcoinMiner = require('../models/BitcoinMiner');
const { startMining, stopMining, simulateMining, toggleCooling } = require('../utils/mining');
const { upgradeRig, upgradeGPU, buyPower, upgradeCooling, tradeBTC } = require('../utils/shop');
const { saveGame, loadGame } = require('../utils/storage');

const router = express.Router();
const state = { miners: {}, currentUser: null };

const requireLogin = (req, res, next) => {
  if (!state.currentUser) return res.status(401).json({ status: 'not_logged_in' });
  next();
};

router.use(async (req, res, next) => {
  await fs.mkdir(path.join(__dirname, '../../data'), { recursive: true });
  next();
});

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ status: 'missing_fields' });

  const usersFile = path.join(__dirname, '../../data/users.json');
  let users = {};
  try {
    users = JSON.parse(await fs.readFile(usersFile, 'utf8') || '{}');
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Error reading users:', error);
  }

  if (users[username]) return res.json({ status: 'user_exists' });

  users[username] = { password: crypto.createHash('sha256').update(password).digest('hex') };
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2));
  state.miners[username] = new BitcoinMiner(username);
  state.currentUser = username;
  res.json({ status: 'registered', username });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ status: 'missing_fields' });

  const usersFile = path.join(__dirname, '../../data/users.json');
  let users = {};
  try {
    users = JSON.parse(await fs.readFile(usersFile, 'utf8') || '{}');
  } catch (error) {
    if (error.code === 'ENOENT') return res.json({ status: 'no_users_found' });
    return res.status(500).json({ status: 'login_failed' });
  }

  const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
  if (!users[username] || users[username].password !== hashedPassword) {
    return res.json({ status: 'invalid_credentials' });
  }

  state.miners[username] = state.miners[username] || new BitcoinMiner(username);
  state.currentUser = username;
  res.json({ status: 'logged_in', username });
});

router.post('/logout', (req, res) => {
  state.currentUser = null;
  res.json({ status: 'logged_out' });
});

router.get('/stats', requireLogin, (req, res) => {
  res.json(state.miners[state.currentUser].getStats());
});

router.post('/start', requireLogin, (req, res) => {
  res.json(startMining(state.miners[state.currentUser]));
});

router.post('/stop', requireLogin, (req, res) => {
  res.json(stopMining(state.miners[state.currentUser]));
});

router.post('/cooling', requireLogin, (req, res) => {
  res.json(toggleCooling(state.miners[state.currentUser]));
});

router.post('/upgrade', requireLogin, (req, res) => {
  const { hashRate, power, cost, type } = req.body;
  if (!hashRate || !power || !cost || !type) return res.status(400).json({ status: 'missing_fields' });
  res.json(upgradeRig(state.miners[state.currentUser], hashRate, power, cost, type));
});

router.post('/upgrade-gpu', requireLogin, (req, res) => {
  const { level, cost } = req.body;
  if (!level || !cost) return res.status(400).json({ status: 'missing_fields' });
  res.json(upgradeGPU(state.miners[state.currentUser], level, cost));
});

router.post('/buy-power', requireLogin, (req, res) => {
  const { power, cost, type } = req.body;
  if (!power || !cost || !type) return res.status(400).json({ status: 'missing_fields' });
  res.json(buyPower(state.miners[state.currentUser], power, cost, type));
});

router.post('/upgrade-cooling', requireLogin, (req, res) => {
  const { level, cost } = req.body;
  if (!level || !cost) return res.status(400).json({ status: 'missing_fields' });
  res.json(upgradeCooling(state.miners[state.currentUser], level, cost));
});

router.post('/trade', requireLogin, (req, res) => {
  const { amount, action } = req.body;
  if (!amount || !action) return res.status(400).json({ status: 'missing_fields' });
  res.json(tradeBTC(state.miners[state.currentUser], amount, action));
});

router.post('/save', requireLogin, async (req, res) => {
  res.json(await saveGame(state.miners[state.currentUser]));
});

router.post('/load', requireLogin, async (req, res) => {
  res.json(await loadGame(state.miners[state.currentUser]));
});

router.get('/translations/:lang', (req, res) => {
  const lang = req.params.lang;
  const filePath = path.join(__dirname, '../../public/translations', `${lang}.json`);
  res.sendFile(filePath, err => {
    if (err) res.status(404).json({ error: 'Language not found' });
  });
});

setInterval(() => {
  for (const username in state.miners) {
    simulateMining(state.miners[username]);
    state.miners[username].adjustDifficulty();
  }
}, 1000);

module.exports = router;