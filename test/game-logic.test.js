const test = require("node:test");
const assert = require("node:assert/strict");

test("distanceSquared returns expected values", async () => {
  const { distanceSquared } = await import("../src/game/logic.mjs");
  assert.equal(distanceSquared(0, 0, 3, 4), 25);
  assert.equal(distanceSquared(5, 2, 5, 2), 0);
});

test("wave scaling and score helpers return stable values", async () => {
  const {
    missilesForWave,
    enemySpeedForWave,
    scoreForMissileKill,
    endWaveBonus,
  } = await import("../src/game/logic.mjs");

  assert.equal(missilesForWave(1), 10);
  assert.equal(missilesForWave(3), 16);
  assert.equal(enemySpeedForWave(1), 60);
  assert.equal(enemySpeedForWave(2), 72);
  assert.equal(scoreForMissileKill(), 50);
  assert.equal(endWaveBonus(4, 10), 500);
});
