import {
  BASE_MISSILES_PER_WAVE,
  ENEMY_SPEED_BASE,
  ENEMY_SPEED_STEP,
  SCORE_PER_MISSILE,
  BONUS_PER_CITY,
  BONUS_PER_AMMO,
} from "./config.mjs";

export function distanceSquared(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export function missilesForWave(wave) {
  return BASE_MISSILES_PER_WAVE + (wave - 1) * 3;
}

export function enemySpeedForWave(wave) {
  return ENEMY_SPEED_BASE + (wave - 1) * ENEMY_SPEED_STEP;
}

export function scoreForMissileKill() {
  return SCORE_PER_MISSILE;
}

export function endWaveBonus(survivingCities, remainingAmmo) {
  return survivingCities * BONUS_PER_CITY + remainingAmmo * BONUS_PER_AMMO;
}
