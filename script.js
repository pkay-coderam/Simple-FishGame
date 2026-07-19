// Get references to the canvas, UI, and restart button.
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const restartBtn = document.getElementById('restartBtn');

// Canvas and game constants.
const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 540;
const BOAT_Y = 110;
const WATER_LINE = 430;
const BOAT_SPEED = 5.5;
const HOOK_SPEED = 7;
const HOOK_MIN_LENGTH = 70;
const HOOK_MAX_LENGTH = 220;
const CREATURE_COUNT = 12;
const WIN_SCORE = 10;
const LOSE_SCORE = -10;
const WIN_OVERLAY = 'You Win!';
const LOSE_OVERLAY = 'Game Over';

// Global game state.
const state = {
  score: 0,
  gameActive: true,
  boatX: CANVAS_WIDTH / 2,
  hookLength: 110,
  creatures: [],
  animationFrameId: null,
  lastTime: 0,
  overlay: null,
  hookCooldown: 0,
};

// Track keyboard input.
const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false,
};

// Create all creatures for the start of the game.
function createCreatures() {
  const types = [
    { name: 'Fish', color: '#f59e0b', isFish: true },
    { name: 'Crab', color: '#ef4444', isFish: false },
    { name: 'Octopus', color: '#8b5cf6', isFish: false },
    { name: 'Jellyfish', color: '#f472b6', isFish: false },
    { name: 'Turtle', color: '#22c55e', isFish: false },
    { name: 'Squid', color: '#0f766e', isFish: false },
    { name: 'Seahorse', color: '#38bdf8', isFish: false },
  ];

  state.creatures = [];
  for (let i = 0; i < CREATURE_COUNT; i += 1) {
    const base = types[i % types.length];
    const direction = Math.random() > 0.5 ? 1 : -1;
    state.creatures.push({
      name: base.name,
      isFish: base.isFish,
      color: base.color,
      x: direction === 1 ? -80 : CANVAS_WIDTH + 80,
      y: 120 + Math.random() * (WATER_LINE - 160),
      speed: 0.8 + Math.random() * 2.0,
      direction,
      size: 16 + Math.random() * 18,
      caught: false,
    });
  }

  // Force the game to contain exactly one collectible fish.
  const fishIndex = state.creatures.findIndex((creature) => creature.isFish);
  if (fishIndex === -1) {
    state.creatures[0].isFish = true;
    state.creatures[0].name = 'Fish';
    state.creatures[0].color = '#f59e0b';
  }
}

// Update boat position based on keyboard input.
function updateBoat(dt) {
  if (!state.gameActive) return;

  if (keys.ArrowLeft) {
    state.boatX -= BOAT_SPEED * dt;
  }
  if (keys.ArrowRight) {
    state.boatX += BOAT_SPEED * dt;
  }

  state.boatX = Math.max(90, Math.min(CANVAS_WIDTH - 90, state.boatX));
}

// Update hook length based on keyboard input while keeping it attached to the boat.
function updateHook(dt) {
  if (!state.gameActive) return;

  if (keys.ArrowDown) {
    state.hookLength += HOOK_SPEED * dt;
  }
  if (keys.ArrowUp) {
    state.hookLength -= HOOK_SPEED * dt;
  }

  state.hookLength = Math.max(HOOK_MIN_LENGTH, Math.min(HOOK_MAX_LENGTH, state.hookLength));
}

// Move each creature across the screen and respawn when it leaves the canvas.
function updateCreatures(dt) {
  if (!state.gameActive) return;

  state.creatures.forEach((creature) => {
    creature.x += creature.speed * creature.direction * dt;

    if (creature.x < -100) {
      creature.x = CANVAS_WIDTH + 100;
      creature.y = 120 + Math.random() * (WATER_LINE - 160);
      creature.speed = 0.8 + Math.random() * 2.0;
      creature.direction = -1;
      creature.caught = false;
    } else if (creature.x > CANVAS_WIDTH + 100) {
      creature.x = -100;
      creature.y = 120 + Math.random() * (WATER_LINE - 160);
      creature.speed = 0.8 + Math.random() * 2.0;
      creature.direction = 1;
      creature.caught = false;
    }
  });
}

// Decrease hook collision cooldown so repeated catches do not happen instantly.
function updateCooldown(dt) {
  if (state.hookCooldown > 0) {
    state.hookCooldown -= dt * 0.06;
    state.hookCooldown = Math.max(0, state.hookCooldown);
  }
}

// Detect hook collisions with creatures and apply score changes.
function detectCollisions() {
  if (!state.gameActive || state.hookCooldown > 0) return;

  const hookX = state.boatX;
  const hookY = BOAT_Y + 60 + state.hookLength;
  let caughtSomething = false;

  for (const creature of state.creatures) {
    if (creature.caught) continue;

    const dx = creature.x - hookX;
    const dy = creature.y - hookY;
    const distance = Math.hypot(dx, dy);
    const hitRadius = creature.size + 14;

    if (distance < hitRadius) {
      creature.caught = true;
      if (creature.isFish) {
        state.score += 2;
      } else {
        state.score -= 2;
      }

      // Respawn immediately elsewhere after being caught.
      creature.x = creature.direction === 1 ? -120 : CANVAS_WIDTH + 120;
      creature.y = 120 + Math.random() * (WATER_LINE - 160);
      creature.speed = 0.8 + Math.random() * 2.0;
      creature.direction *= -1;
      creature.caught = false;

      scoreEl.textContent = state.score;
      state.hookCooldown = 1.2;
      caughtSomething = true;
      break;
    }
  }

  if (caughtSomething) {
    if (state.score >= WIN_SCORE) {
      state.overlay = WIN_OVERLAY;
      state.gameActive = false;
    } else if (state.score <= LOSE_SCORE) {
      state.overlay = LOSE_OVERLAY;
      state.gameActive = false;
    }
  }
}

// Draw the animated ocean background with a sky and sea.
function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, WATER_LINE);
  sky.addColorStop(0, '#7dd3fc');
  sky.addColorStop(0.7, '#38bdf8');
  sky.addColorStop(1, '#0284c7');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_WIDTH, WATER_LINE);

  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(140, 120, 40, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(0, WATER_LINE, CANVAS_WIDTH, CANVAS_HEIGHT - WATER_LINE);

  // A few floating bubbles to make the sea feel alive.
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 10; i += 1) {
    const x = (i * 95) + ((Date.now() / 500) % 95);
    const y = WATER_LINE + 18 + (i % 3) * 16;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// Draw the fishing boat with a rod and hook.
function drawBoat() {
  const boatX = state.boatX;
  ctx.save();
  ctx.translate(boatX, BOAT_Y);

  // Boat hull.
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(-70, 28);
  ctx.quadraticCurveTo(0, -20, 70, 28);
  ctx.lineTo(58, 44);
  ctx.quadraticCurveTo(0, 56, -58, 44);
  ctx.closePath();
  ctx.fill();

  // Cabin.
  ctx.fillStyle = '#fb923c';
  ctx.fillRect(-24, 8, 48, 24);

  // Pole and rope.
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 58);
  ctx.stroke();

  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 58);
  ctx.lineTo(0, state.hookLength);
  ctx.stroke();

  // Hook.
  const hookY = state.hookLength;
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(0, hookY, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Draw each creature with a distinct cartoon shape.
function drawCreatures() {
  state.creatures.forEach((creature) => {
    ctx.save();
    ctx.translate(creature.x, creature.y);
    if (creature.direction < 0) {
      ctx.scale(-1, 1);
    }

    if (creature.name === 'Fish') {
      ctx.fillStyle = creature.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, creature.size + 4, creature.size - 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.moveTo(creature.size + 2, 0);
      ctx.lineTo(creature.size + 16, -8);
      ctx.lineTo(creature.size + 16, 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(6, -4, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (creature.name === 'Crab') {
      ctx.fillStyle = creature.color;
      ctx.fillRect(-10, -8, 20, 16);
      ctx.fillRect(-14, -4, 6, 12);
      ctx.fillRect(8, -4, 6, 12);
      ctx.fillStyle = '#fef2f2';
      ctx.fillRect(-4, -2, 8, 4);
    } else if (creature.name === 'Octopus') {
      ctx.fillStyle = creature.color;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-6, -2, 12, 4);
    } else if (creature.name === 'Jellyfish') {
      ctx.fillStyle = creature.color;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fdf2f8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, -10);
      ctx.quadraticCurveTo(0, -24, 10, -10);
      ctx.stroke();
    } else if (creature.name === 'Turtle') {
      ctx.fillStyle = creature.color;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#14532d';
      ctx.fillRect(-6, -2, 12, 4);
    } else if (creature.name === 'Squid') {
      ctx.fillStyle = creature.color;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(-8, 24);
      ctx.moveTo(0, 10);
      ctx.lineTo(8, 24);
      ctx.stroke();
    } else if (creature.name === 'Seahorse') {
      ctx.fillStyle = creature.color;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.quadraticCurveTo(0, -14, 10, 0);
      ctx.quadraticCurveTo(0, 14, -10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(6, -2, 8, 4);
    }

    ctx.restore();
  });
}

// Draw score and control instructions near the top of the screen.
function drawUI() {
  ctx.save();
  ctx.font = 'bold 24px Trebuchet MS';
  ctx.fillStyle = '#fef3c7';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${state.score}`, 22, 30);
  ctx.font = '16px Trebuchet MS';
  ctx.fillText('Move boat with ← → • Raise/lower with ↑ ↓', 22, 56);
  ctx.restore();
}

// Show the win or lose overlay and stop the game loop logic.
function drawOverlay() {
  if (!state.overlay) return;

  ctx.save();
  ctx.fillStyle = 'rgba(2, 8, 23, 0.75)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = '#fef3c7';
  ctx.textAlign = 'center';
  ctx.font = 'bold 60px Trebuchet MS';
  ctx.fillText(state.overlay, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  ctx.font = '24px Trebuchet MS';
  ctx.fillText('Press Restart Game to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 24);
  ctx.restore();
}

// Draw the whole scene each frame.
function drawScene() {
  drawBackground();
  drawBoat();
  drawCreatures();
  drawUI();
  drawOverlay();
}

// Reset the game back to its initial state.
function resetGame() {
  if (state.animationFrameId) {
    cancelAnimationFrame(state.animationFrameId);
  }

  state.score = 0;
  state.gameActive = true;
  state.boatX = CANVAS_WIDTH / 2;
  state.hookLength = 110;
  state.creatures = [];
  state.overlay = null;
  state.hookCooldown = 0;
  scoreEl.textContent = '0';
  createCreatures();
  drawScene();
  state.lastTime = 0;
  state.animationFrameId = requestAnimationFrame(gameLoop);
}

// Main animation loop.
function gameLoop(timestamp) {
  if (!state.lastTime) {
    state.lastTime = timestamp;
  }
  const dt = (timestamp - state.lastTime) / 16.67;
  state.lastTime = timestamp;

  if (state.gameActive) {
    updateBoat(dt);
    updateHook(dt);
    updateCreatures(dt);
    updateCooldown(dt);
    detectCollisions();
  }

  drawScene();
  state.animationFrameId = requestAnimationFrame(gameLoop);
}

// Keyboard handlers for boat and hook control.
function handleKeyDown(event) {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    keys[event.key] = true;
    event.preventDefault();
  }
}

function handleKeyUp(event) {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    keys[event.key] = false;
    event.preventDefault();
  }
}

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
restartBtn.addEventListener('click', resetGame);

// Start the game when the page loads.
resetGame();
