// src/utils/mining.js
function startMining(miner) {
  if (miner.state.isMining) return { status: 'already_mining' };
  if (miner.stats.temp >= 85) return { status: 'overheat' };
  if (miner.stats.powerConsumption > miner.stats.solarPower + miner.stats.windPower + miner.stats.nuclearPower && miner.stats.wallet < 10) {
    return { status: 'insufficient_power_funds' };
  }

  miner.state.isMining = true;
  miner.miningLog.push(`Mining started at ${new Date().toLocaleTimeString()}`);
  return { status: 'mining_started', isMining: true };
}

function stopMining(miner) {
  miner.state.isMining = false;
  miner.miningLog.push(`Mining stopped at ${new Date().toLocaleTimeString()}`);
  return { status: 'mining_stopped', isMining: false };
}

function simulateMining(miner) {
  if (!miner.state.isMining) return;

  const failureChance = Math.min(0.3, miner.stats.temp / 200); // โอกาสล้มเหลวสูงขึ้นถ้าร้อน
  if (Math.random() < failureChance) {
    miner.miningLog.push('Mining failed due to overheating!');
    stopMining(miner);
    return;
  }

  let hashesProcessed = 0;
  for (let i = 0; i < Math.floor(miner.stats.hashRate / 10); i++) { // ลดการขุดให้สมจริง
    const header = miner.createBlockHeader(miner.state.nonce.toString(16));
    const hash = miner.calculateHash(header);
    hashesProcessed++;

    if (hash < miner.stats.difficulty) {
      const reward = miner.stats.blockReward * (1 - miner.state.marketDemand / 100); // รางวัลลดลงถ้าตลาดอิ่มตัว
      miner.stats.bitcoinMined += reward;
      miner.stats.blocksMined++;
      miner.stats.exp += 5;
      miner.state.nonce = 0;
      miner.miningLog.push(`Block mined! Reward: ${reward.toFixed(4)} BTC`);
      if (miner.stats.blocksMined % 100 === 0) miner.stats.blockReward = Math.max(0.01, miner.stats.blockReward / 2);
    }
    miner.state.nonce++;
  }

  const effectivePower = Math.max(miner.stats.powerConsumption - (miner.stats.solarPower + miner.stats.windPower + miner.stats.nuclearPower), 0);
  miner.stats.totalPowerUsed += effectivePower / 3600;
  miner.stats.wallet -= effectivePower * miner.stats.energyCost;
  miner.stats.temp += effectivePower * 0.2 - (miner.state.coolingActive ? miner.stats.coolingLevel * 0.5 : 0);
  miner.stats.temp = Math.max(20, Math.min(100, miner.stats.temp));

  miner.updateMarket();
  miner.history.push({ time: new Date().toLocaleTimeString(), btcMined: miner.stats.bitcoinMined, btcPrice: miner.stats.btcPrice });
  if (miner.history.length > 60) miner.history.shift();

  miner.updateMissions();
  if (!miner.state.coolingActive && miner.stats.temp > 20) miner.stats.temp -= 0.1;
}

function toggleCooling(miner) {
  miner.state.coolingActive = !miner.state.coolingActive;
  miner.stats.wallet -= miner.state.coolingActive ? miner.stats.coolingLevel * 5 : 0; // ค่าใช้จ่ายการระบายความร้อน
  return { status: miner.state.coolingActive ? 'cooling_on' : 'cooling_off' };
}

module.exports = { startMining, stopMining, simulateMining, toggleCooling };