// src/utils/mining.js
function startMining(miner) {
    if (miner.isMining) {
      console.log(`User ${miner.username}: Already mining`);
      return { status: 'already_mining' };
    }
    if (miner.temp >= 80) {
      console.log(`User ${miner.username}: Overheat, temp = ${miner.temp}`);
      return { status: 'overheat' };
    }
    miner.isMining = true;
    console.log(`User ${miner.username}: Mining started, hashRate = ${miner.hashRate}`);
    return { status: 'mining_started', isMining: miner.isMining };
  }
  
  function stopMining(miner) {
    miner.isMining = false;
    console.log(`User ${miner.username}: Mining stopped`);
    return { status: 'mining_stopped', isMining: miner.isMining };
  }
  
  function simulateMining(miner) {
    if (!miner.isMining) return;
  
    let hashesProcessed = 0;
    for (let i = 0; i < miner.hashRate; i++) {
      const header = miner.createBlockHeader(miner.nonce.toString(16));
      const hash = miner.calculateHash(header);
      hashesProcessed++;
      if (hash < miner.difficulty) {
        miner.bitcoinMined += miner.blockReward;
        miner.keysMined++;
        miner.exp += 10;
        miner.nonce = 0;
        miner.miningLog.push(`Block mined! Reward: ${miner.blockReward} BTC at ${new Date().toLocaleTimeString()}`);
        if (miner.miningLog.length > 5) miner.miningLog.shift();
        miner.checkLevelUp();
      }
      miner.nonce++;
    }
  
    const effectivePower = Math.max(miner.powerConsumption - miner.solarPower, 0);
    miner.totalPowerUsed += effectivePower / 3600;
    miner.wallet -= (effectivePower / 3600) * miner.electricityCostPerKWh;
    miner.btcPrice = Math.max(1000, miner.btcPrice * (1 + (Math.random() * 0.1 - 0.05)));
    miner.temp += miner.powerConsumption * 0.1;
    if (miner.temp >= 80) stopMining(miner);
  
    if (miner.keysMined > 0 && miner.keysMined % 50 === 0) {
      miner.blockReward = Math.max(0.01, miner.blockReward / 2);
    }
  
    miner.history.push({ time: new Date().toLocaleTimeString(), btcMined: miner.bitcoinMined, btcPrice: miner.btcPrice });
    if (miner.history.length > 60) miner.history.shift();
  
    miner.updateMissions();
    if (miner.temp > 20) miner.temp -= 0.5;
  
    console.log(`User ${miner.username}: Simulated mining, hashes = ${hashesProcessed}, BTC = ${miner.bitcoinMined}`);
  }
  
  module.exports = { startMining, stopMining, simulateMining };