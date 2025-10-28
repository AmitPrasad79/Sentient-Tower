// ===== ELEMENTS =====
const menuScreen = document.getElementById("menu");
const gameScreen = document.getElementById("game");
const startBtn = document.getElementById("start-btn");
const modeBtns = document.querySelectorAll(".mode-btn");
const resetBtn = document.getElementById("reset-btn");
const menuBtn = document.getElementById("menu-btn");
const towerCanvas = document.getElementById("towerCanvas");
const scoreEl = document.getElementById("score");
const winPopup = document.getElementById("win");
const winMain = document.getElementById("win-main");
const winRestart = document.getElementById("win-restart");

const ctx = towerCanvas.getContext("2d");

// ===== VARIABLES =====
let W, H;
let tower = [];
let moving = null;
let score = 0;
let speed = 120;
let blockHeight = 32;
let gameRunning = false;

// ===== CANVAS SIZE =====
function resizeCanvas() {
  const rect = towerCanvas.getBoundingClientRect();
  W = rect.width;
  H = rect.height;
  towerCanvas.width = W * devicePixelRatio;
  towerCanvas.height = H * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ===== MODE BUTTONS =====
modeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    modeBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    startBtn.disabled = false;

    const sp = btn.dataset.speed;
    if (sp === "slow") speed = 120;
    if (sp === "medium") speed = 180;
    if (sp === "fast") speed = 250;
  });
});

// ===== START GAME =====
startBtn.addEventListener("click", () => {
  menuScreen.classList.remove("active");
  menuScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  gameScreen.classList.add("active");

  score = 0;
  tower = [];
  moving = null;
  scoreEl.textContent = "Score: 0";
  gameRunning = false;
  startCountdown();
});

// ===== COUNTDOWN =====
function startCountdown() {
  let count = 3;
  const timer = setInterval(() => {
    drawCountdown(count);
    count--;
    if (count < 0) {
      clearInterval(timer);
      gameRunning = true;
      initTower();
      loop();
    }
  }, 1000);
}

function drawCountdown(n) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#ff5aa3";
  ctx.font = `${H / 3}px Arial Black`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(n > 0 ? n : "GO!", W / 2, H / 2);
}

// ===== INIT =====
function initTower() {
  tower = [];
  const base = {
    x: W / 2,
    y: H - blockHeight / 2,
    w: W * 0.6,
    h: blockHeight,
    color: "#ff4db8",
  };
  tower.push(base);
  spawnMoving();
}

// ===== SPAWN MOVING BLOCK =====
function spawnMoving() {
  const last = tower[tower.length - 1];
  moving = {
    x: 0,
    y: last.y - blockHeight - 4,
    w: last.w,
    h: blockHeight,
    dir: 1,
    color: "#ff4db8",
  };
}

// ===== DRAW BLOCK =====
function drawBlock(b) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.fillStyle = b.color;
  ctx.shadowColor = "#ff4db8";
  ctx.shadowBlur = 10;
  ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
  ctx.restore();
}

// ===== LOOP =====
function loop() {
  ctx.clearRect(0, 0, W, H);

  // Move current block
  if (moving && gameRunning) {
    moving.x += moving.dir * speed * 0.016;
    if (moving.x - moving.w / 2 < 0 || moving.x + moving.w / 2 > W)
      moving.dir *= -1;
  }

  // Draw blocks
  for (const b of tower) drawBlock(b);
  if (moving) drawBlock(moving);

  requestAnimationFrame(loop);
}

// ===== PLACE BLOCK =====
towerCanvas.addEventListener("click", placeBlock);
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") placeBlock();
});

function placeBlock() {
  if (!gameRunning || !moving) return;

  const top = tower[tower.length - 1];
  const left = Math.max(moving.x - moving.w / 2, top.x - top.w / 2);
  const right = Math.min(moving.x + moving.w / 2, top.x + top.w / 2);
  const overlap = right - left;

  if (overlap <= 0) {
    gameOver();
    return;
  }

  const newBlock = {
    x: (left + right) / 2,
    y: moving.y,
    w: overlap,
    h: blockHeight,
    color: "#ff4db8",
  };
  tower.push(newBlock);
  score++;
  scoreEl.textContent = "Score: " + score;

  // Raise stack
  for (const b of tower) b.y += blockHeight + 4;
  moving = null;
  setTimeout(spawnMoving, 200);
}

// ===== GAME OVER =====
function gameOver() {
  gameRunning = false;
  winPopup.classList.remove("hidden");
}

// ===== BUTTONS =====
resetBtn.addEventListener("click", () => {
  winPopup.classList.add("hidden");
  score = 0;
  scoreEl.textContent = "Score: 0";
  tower = [];
  moving = null;
  gameRunning = false;
  startCountdown();
});

menuBtn.addEventListener("click", () => {
  gameScreen.classList.add("hidden");
  gameScreen.classList.remove("active");
  menuScreen.classList.remove("hidden");
  menuScreen.classList.add("active");
});

winMain.addEventListener("click", () => {
  winPopup.classList.add("hidden");
  menuScreen.classList.remove("hidden");
  menuScreen.classList.add("active");
  gameScreen.classList.add("hidden");
});

winRestart.addEventListener("click", () => {
  winPopup.classList.add("hidden");
  score = 0;
  tower = [];
  moving = null;
  startCountdown();
});
