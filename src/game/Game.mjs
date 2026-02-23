import {
  GAME_WIDTH,
  GAME_HEIGHT,
  CITY_COUNT,
  BATTERY_COUNT,
  BASE_AMMO_PER_BATTERY,
  INTERCEPTOR_SPEED,
  EXPLOSION_GROWTH,
  EXPLOSION_SHRINK,
  EXPLOSION_MAX_RADIUS,
} from "./config.mjs";
import {
  distanceSquared,
  missilesForWave,
  enemySpeedForWave,
  scoreForMissileKill,
  endWaveBonus,
} from "./logic.mjs";

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function moveTowards(entity, dt) {
  const dx = entity.tx - entity.x;
  const dy = entity.ty - entity.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return 0;
  const step = entity.speed * dt;
  if (step >= len) {
    entity.x = entity.tx;
    entity.y = entity.ty;
    return len;
  }
  entity.x += (dx / len) * step;
  entity.y += (dy / len) * step;
  return step;
}

export class Game {
  constructor(width = GAME_WIDTH, height = GAME_HEIGHT) {
    this.width = width;
    this.height = height;
    this.reset();
  }

  reset() {
    this.state = "menu";
    this.wave = 0;
    this.score = 0;
    this.enemyMissiles = [];
    this.interceptors = [];
    this.explosions = [];
    this.spawnTimer = 0;
    this.toSpawn = 0;
    this.spawned = 0;
    this.nextSpawnIn = 0.5;

    const groundY = this.height - 36;
    const segment = this.width / CITY_COUNT;
    this.cities = Array.from({ length: CITY_COUNT }, (_, i) => ({
      x: segment * (i + 0.5),
      y: groundY,
      alive: true,
    }));

    const batterySegment = this.width / BATTERY_COUNT;
    this.batteries = Array.from({ length: BATTERY_COUNT }, (_, i) => ({
      x: batterySegment * (i + 0.5),
      y: groundY,
      alive: true,
      ammo: BASE_AMMO_PER_BATTERY,
    }));
  }

  start() {
    this.reset();
    this.state = "playing";
    this.startWave(1);
  }

  restart() {
    this.start();
  }

  startWave(wave) {
    this.wave = wave;
    this.toSpawn = missilesForWave(wave);
    this.spawned = 0;
    this.nextSpawnIn = 0.3;
    this.batteries.forEach((battery) => {
      if (battery.alive) battery.ammo = BASE_AMMO_PER_BATTERY;
    });
  }

  aliveCitiesCount() {
    return this.cities.filter((city) => city.alive).length;
  }

  aliveTargets() {
    return [...this.cities, ...this.batteries].filter((t) => t.alive);
  }

  totalAmmo() {
    return this.batteries.reduce((sum, b) => sum + (b.alive ? b.ammo : 0), 0);
  }

  fireAt(x, y) {
    if (this.state !== "playing") return false;
    const candidates = this.batteries.filter((b) => b.alive && b.ammo > 0);
    if (candidates.length === 0) return false;
    let chosen = candidates[0];
    let best = Infinity;
    for (const battery of candidates) {
      const d = distanceSquared(x, y, battery.x, battery.y);
      if (d < best) {
        best = d;
        chosen = battery;
      }
    }
    chosen.ammo -= 1;
    this.interceptors.push({
      x: chosen.x,
      y: chosen.y,
      tx: x,
      ty: y,
      speed: INTERCEPTOR_SPEED,
    });
    return true;
  }

  spawnEnemyMissile() {
    const targets = this.aliveTargets();
    if (targets.length === 0) return;
    const target = targets[Math.floor(Math.random() * targets.length)];
    const sx = 20 + Math.random() * (this.width - 40);
    const sy = 10;
    this.enemyMissiles.push({
      x: sx,
      y: sy,
      tx: target.x,
      ty: target.y,
      target,
      speed: enemySpeedForWave(this.wave),
    });
  }

  makeExplosion(x, y, maxRadius = EXPLOSION_MAX_RADIUS) {
    this.explosions.push({
      x,
      y,
      radius: 1,
      maxRadius,
      phase: "growing",
    });
  }

  update(dt) {
    if (this.state !== "playing") return;

    if (this.spawned < this.toSpawn) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= this.nextSpawnIn) {
        this.spawnTimer = 0;
        this.spawnEnemyMissile();
        this.spawned += 1;
        this.nextSpawnIn = Math.max(0.1, 0.55 - this.wave * 0.03);
      }
    }

    for (let i = this.interceptors.length - 1; i >= 0; i -= 1) {
      const interceptor = this.interceptors[i];
      moveTowards(interceptor, dt);
      if (
        distanceSquared(interceptor.x, interceptor.y, interceptor.tx, interceptor.ty) <=
        4
      ) {
        this.interceptors.splice(i, 1);
        this.makeExplosion(interceptor.x, interceptor.y);
      }
    }

    for (let i = this.enemyMissiles.length - 1; i >= 0; i -= 1) {
      const missile = this.enemyMissiles[i];
      moveTowards(missile, dt);
      if (distanceSquared(missile.x, missile.y, missile.tx, missile.ty) <= 9) {
        this.enemyMissiles.splice(i, 1);
        if (missile.target.alive) {
          missile.target.alive = false;
          if (missile.target.ammo !== undefined) {
            missile.target.ammo = 0;
          }
        }
      }
    }

    for (let i = this.explosions.length - 1; i >= 0; i -= 1) {
      const explosion = this.explosions[i];
      if (explosion.phase === "growing") {
        explosion.radius += EXPLOSION_GROWTH * dt;
        if (explosion.radius >= explosion.maxRadius) {
          explosion.radius = explosion.maxRadius;
          explosion.phase = "shrinking";
        }
      } else {
        explosion.radius -= EXPLOSION_SHRINK * dt;
        if (explosion.radius <= 1) {
          this.explosions.splice(i, 1);
        }
      }
    }

    for (let i = this.enemyMissiles.length - 1; i >= 0; i -= 1) {
      const missile = this.enemyMissiles[i];
      let hit = false;
      for (const explosion of this.explosions) {
        const rr = explosion.radius * explosion.radius;
        if (distanceSquared(missile.x, missile.y, explosion.x, explosion.y) <= rr) {
          hit = true;
          break;
        }
      }
      if (hit) {
        this.enemyMissiles.splice(i, 1);
        this.score += scoreForMissileKill();
        this.makeExplosion(missile.x, missile.y, EXPLOSION_MAX_RADIUS * 0.7);
      }
    }

    if (this.aliveCitiesCount() === 0) {
      this.state = "gameover";
      return;
    }

    if (this.spawned >= this.toSpawn && this.enemyMissiles.length === 0) {
      this.score += endWaveBonus(this.aliveCitiesCount(), this.totalAmmo());
      this.startWave(this.wave + 1);
    }
  }

  draw(ctx) {
    ctx.clearRect(0, 0, this.width, this.height);
    this.drawBackground(ctx);
    this.drawGround(ctx);
    this.drawEntities(ctx);
    this.drawOverlay(ctx);
  }

  drawBackground(ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, "#091325");
    grad.addColorStop(1, "#0a1320");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = "rgba(255,255,255,0.35)";
    for (let i = 0; i < 65; i += 1) {
      const x = ((i * 137) % this.width) | 0;
      const y = ((i * 97) % (this.height - 80)) | 0;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  drawGround(ctx) {
    const groundY = this.height - 26;
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, this.height);
    groundGrad.addColorStop(0, "#14293f");
    groundGrad.addColorStop(1, "#1a3a57");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, this.width, this.height - groundY);
  }

  drawEntities(ctx) {
    for (const city of this.cities) {
      ctx.fillStyle = city.alive ? "#8ec2ff" : "#4a5f78";
      ctx.fillRect(city.x - 14, city.y - 16, 28, 16);
    }

    for (const battery of this.batteries) {
      ctx.fillStyle = battery.alive ? "#76ffa2" : "#4f7861";
      ctx.fillRect(battery.x - 13, battery.y - 10, 26, 10);
      if (battery.alive) {
        const ammoRatio = battery.ammo / BASE_AMMO_PER_BATTERY;
        ctx.fillStyle = "#b2ffd3";
        ctx.fillRect(battery.x - 13, battery.y - 14, 26 * ammoRatio, 2);
      }
    }

    ctx.strokeStyle = "#ff5f77";
    ctx.lineWidth = 2;
    for (const missile of this.enemyMissiles) {
      ctx.beginPath();
      ctx.moveTo(missile.x, missile.y);
      ctx.lineTo(missile.tx, missile.ty);
      ctx.stroke();
    }

    ctx.strokeStyle = "#7dd6ff";
    for (const interceptor of this.interceptors) {
      ctx.beginPath();
      ctx.moveTo(interceptor.x, interceptor.y);
      ctx.lineTo(interceptor.tx, interceptor.ty);
      ctx.stroke();
    }

    for (const explosion of this.explosions) {
      const alpha = explosion.phase === "growing" ? 0.5 : 0.35;
      const k = Math.min(1, explosion.radius / explosion.maxRadius);
      const hue = lerp(42, 10, k);
      ctx.fillStyle = `hsla(${hue}, 92%, 60%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawOverlay(ctx) {
    if (this.state === "menu") {
      this.drawCenteredText(
        ctx,
        "MISSILES OVER XERION",
        "Click canvas or press Space to start",
      );
    }
    if (this.state === "gameover") {
      this.drawCenteredText(
        ctx,
        "GAME OVER",
        `Final score: ${this.score} | Press Space to restart`,
      );
    }
  }

  drawCenteredText(ctx, title, subtitle) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.textAlign = "center";
    ctx.fillStyle = "#dce8ff";
    ctx.font = "bold 42px Trebuchet MS";
    ctx.fillText(title, this.width / 2, this.height / 2 - 16);
    ctx.font = "20px Trebuchet MS";
    ctx.fillStyle = "#a7c0e4";
    ctx.fillText(subtitle, this.width / 2, this.height / 2 + 20);
  }
}
