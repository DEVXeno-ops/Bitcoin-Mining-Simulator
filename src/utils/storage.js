// src/utils/storage.js
const fs = require('fs').promises;
const path = require('path');

/**
 * Save miner game state to file
 * @param {BitcoinMiner} miner - The miner instance
 * @returns {Promise<Object>} Status of the operation
 */
async function saveGame(miner) {
  const data = {
    stats: miner.stats,
    purchases: miner.purchases,
    missions: miner.missions
  };
  const saveDir = path.join(__dirname, '../../data/saves');
  try {
    await fs.mkdir(saveDir, { recursive: true });
    await fs.writeFile(path.join(saveDir, `${miner.username}.json`), JSON.stringify(data, null, 2));
    return { status: 'game_saved' };
  } catch (error) {
    console.error(`Error saving game for ${miner.username}:`, error);
    return { status: 'save_failed', error: error.message };
  }
}

/**
 * Load miner game state from file
 * @param {BitcoinMiner} miner - The miner instance
 * @returns {Promise<Object>} Status of the operation
 */
async function loadGame(miner) {
  const saveFile = path.join(__dirname, '../../data/saves', `${miner.username}.json`);
  try {
    const data = JSON.parse(await fs.readFile(saveFile, 'utf8'));
    Object.assign(miner.stats, data.stats);
    Object.assign(miner.purchases, data.purchases);
    miner.missions = data.missions;
    return { status: 'game_loaded' };
  } catch (error) {
    if (error.code === 'ENOENT') return { status: 'no_save_found' };
    console.error(`Error loading game for ${miner.username}:`, error);
    return { status: 'load_failed', error: error.message };
  }
}

module.exports = { saveGame, loadGame };