const canvas = document.getElementById("towerCanvas");
const ctx = canvas.getContext("2d");

const currentScoreEl = document.getElementById("current-score");
const bestScoreEl = document.getElementById("best-score");
const restartBtn = document.getElementById("restart-btn");
const startBtn = document.getElementById("start-btn");
const modeButtons = document.querySelectorAll(".mode-btn");

let canvasWidth, canvasHeight;

// Game state
let STATE = {
  blocks: [],
  moving: null,
  falling: [],
  score: 0,
  best: parseInt(localStorage.getItem("sentient_tower_best") || "0", 10),
  running: false,
  mode: "easy",
  speed: 150,
  tolerance: 15,
  blockHeight: 36,
  minWidth: 20,
  countdown: 0
};

// Setup canvas
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvasWidth = rect.width;
  canvasHeight = rect.height;
  canvas.width = canvasWidth * devicePixelRatio;
  canvas.height = canvasHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Modes
const MODES = {
  easy: { speed: 100, tolerance: 25 },
  medium: { speed: 180, tolerance: 12 },
  hard: { speed: 260, tolerance: 6 }
};

// Start game logic
function startGame() {
  const modeConfig = MODES[STATE.mode];
  STATE.speed = modeConfig.speed;
  STATE.tolerance = modeConfig.tolerance;
  STATE.blocks = [];
  STATE.falling = [];
  STATE.score = 0;
  STATE.running = false;
  restartBtn.classList.add("hidden");
  updateScores();
  startCountdown();
}

// Countdown animation (3...2...1...)
function startCountdown() {
  STATE.countdown = 3;
  const countdownInterval = setInterval(() => {
    drawCountdown(STATE.countdown);
    STATE.countdown--;
    if (STATE.countdown < 0) {
      clearInterval(countdownInterval);
      STATE.running = true;
      initGame();
    }
  }, 1000);
}

// Draw countdown numbers
function drawCountdown(number) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = "#ff5aa3";
  ctx.font = `${canvasHeight / 3}px Arial Black`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(number > 0 ? number : "GO!", canvasWidth / 2, canvasHeight / 2);
}

// Initialize game blocks after countdown
function initGame() {
  const baseWidth = canvasWidth * 0.6;
  const baseBlock = {
    x: canvasWidth / 2,
    y: canvasHeight - STATE.blockHeight / 2,
    w: baseWidth,
    h: STATE.blockHeight,
    color: "#e64a8f"
  };
  STATE.blocks.push(baseBlock);
  spawnMovingBlock();
}

// Spawn new moving block
function spawnMovingBlock() {
  const top = STATE.blocks[STATE.blocks.length - 1];
  const block = {
    x: 0,
    y: top.y - STATE.blockHeight - 6,
    w: top.w,
    h: STATE.blockHeight,
    color: "#ff5aa3",
    vx: STATE.speed,
    sliding: true
  };
  STATE.moving = block;
}

// Stop block
function stopBlock() {
  if (!STATE.running || !STATE.moving) return;

  const top = STATE.blocks[STATE.blocks.length - 1];
  const cur = STATE.moving;
  const leftA = cur.x - cur.w / 2;
  const rightA = cur.x + cur.w / 2;
  const leftB = top.x - top.w / 2;
  const rightB = top.x + top.w / 2;
  const overlap = Math.max(0, Math.min(rightA, rightB) - Math.max(leftA, leftB));

  if (overlap <= 0 || overlap < STATE.minWidth) {
    gameOver();
    return;
  }

  const overlapCenter = Math.max(leftA, leftB) + overlap / 2;
  const newBlock = {
    x: overlapCenter,
    y: cur.y,
    w: overlap,
    h: cur.h,
    color: "#ff5aa3"
  };
  STATE.blocks.push(newBlock);

  STATE.score++;
  updateScores();
  STATE.moving = null;
  for (let b of STATE.blocks) b.y += STATE.blockHeight + 6;
  setTimeout(spawnMovingBlock, 150);
}

// Update score UI
function updateScores() {
  currentScoreEl.textContent = `Score: ${STATE.score}`;
  if (STATE.score > STATE.best) {
    STATE.best = STATE.score;
    localStorage.setItem("sentient_tower_best", STATE.best);
  }
  bestScoreEl.textContent = `Best: ${STATE.best}`;
}

// Game over
function gameOver() {
  STATE.running = false;
  restartBtn.classList.remove("hidden");
}

// Drawing
function draw() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  for (let b of STATE.blocks) drawBlock(b);
  if (STATE.moving) drawBlock(STATE.moving);
  requestAnimationFrame(draw);
}
function drawBlock(b) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.fillStyle = b.color;
  ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
  ctx.restore();
}

// Update movement
function update(dt) {
  if (STATE.running && STATE.moving && STATE.moving.sliding) {
    STATE.moving.x += STATE.moving.vx * dt;
    if (STATE.moving.x - STATE.moving.w / 2 < 0 || STATE.moving.x + STATE.moving.w / 2 > canvasWidth)
      STATE.moving.vx *= -1;
  }
  setTimeout(() => update(0.016), 16);
}

// Listeners
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") stopBlock();
});
canvas.addEventListener("click", stopBlock);
restartBtn.addEventListener("click", startGame);
startBtn.addEventListener("click", () => {
  startBtn.classList.add("hidden");
  startGame();
});
modeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    STATE.mode = btn.dataset.mode;
  });
});

// Animation start
draw();
update(0.016);
