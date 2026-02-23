import { GAME_WIDTH, GAME_HEIGHT } from "./game/config.mjs";
import { Game } from "./game/Game.mjs";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const waveEl = document.getElementById("wave");
const citiesEl = document.getElementById("cities");
const ammoEl = document.getElementById("ammo");

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

const game = new Game();

function updateHud() {
  scoreEl.textContent = `Score: ${game.score}`;
  waveEl.textContent = `Wave: ${game.wave}`;
  citiesEl.textContent = `Cities: ${game.aliveCitiesCount()}`;
  ammoEl.textContent = `Ammo: ${game.totalAmmo()}`;
}

function startIfNeeded() {
  if (game.state === "menu") {
    game.start();
  } else if (game.state === "gameover") {
    game.restart();
  }
}

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  const x = (event.clientX - rect.left) * sx;
  const y = (event.clientY - rect.top) * sy;
  if (game.state !== "playing") {
    startIfNeeded();
    return;
  }
  game.fireAt(x, y);
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "Enter") {
    startIfNeeded();
  }
});

let last = performance.now();
const stepCap = 1 / 20;
function loop(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > stepCap) dt = stepCap;
  game.update(dt);
  game.draw(ctx);
  updateHud();
  requestAnimationFrame(loop);
}

updateHud();
game.draw(ctx);
requestAnimationFrame(loop);
