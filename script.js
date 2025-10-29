// 🎯 SENTIENT TOWER GAME LOGIC

const towerCanvas = document.getElementById("towerCanvas");
const ctx = towerCanvas.getContext("2d");

// DOM elements
const menu = document.getElementById("menu");
const game = document.getElementById("game");
const winPopup = document.getElementById("win");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const menuBtn = document.getElementById("menu-btn");
const winRestart = document.getElementById("win-restart");
const winMain = document.getElementById("win-main");
const scoreEl = document.getElementById("score");
const modeBtns = document.querySelectorAll(".mode-btn");

let speed = 4;
let tower = [];
let moving = null;
let blockHeight = 25;
let score = 0;
let gameRunning = false;
let gameOver = false;

// 🧱 Resize canvas to fit container
function resizeCanvas() {
  const box = document.querySelector(".tower-box");
  towerCanvas.width = box.clientWidth;
  towerCanvas.height = box.clientHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// 🧱 Block helper
function createBlock(x, y, w, h, color) {
  return { x, y, w, h, color };
}

// 🎬 Game start
function startGame() {
  gameRunning = true;
  gameOver = false;
  score = 0;
  scoreEl.textContent = "Score: 0";
  tower = [];
  const baseWidth = towerCanvas.width * 0.6;
  const baseBlock = createBlock(
    towerCanvas.width / 2,
    towerCanvas.height - blockHeight / 2,
    baseWidth,
    blockHeight,
    "#ff66cc"
  );
  tower.push(baseBlock);
  spawnMoving();
  animate();
}

// 🧱 Spawn a new moving block
function spawnMoving() {
  const last = tower[tower.length - 1];
  moving = createBlock(
    towerCanvas.width / 2,
    last.y - blockHeight - 6,
    last.w,
    blockHeight,
    "#ff66cc"
  );
  moving.dir = 1;
}

// 🎯 Handle click / space to drop
function dropBlock() {
  if (!gameRunning || gameOver) return;

  const last = tower[tower.length - 1];
  const diff = moving.x - last.x;
  const overlap = last.w - Math.abs(diff);

  if (overlap <= 5) {
    // ❌ Missed
    gameOver = true;
    showWin();
    return;
  }

  // Trim the block to overlap
  const newWidth = overlap;
  const newX = last.x + diff / 2;
  const newBlock = createBlock(newX, moving.y, newWidth, blockHeight, "#ff66cc");
  tower.push(newBlock);
  score++;
  scoreEl.textContent = `Score: ${score}`;
  spawnMoving();
}

// 🧱 Animation
function animate() {
  if (!gameRunning) return;
  ctx.clearRect(0, 0, towerCanvas.width, towerCanvas.height);

  // Draw tower
  for (const b of tower) {
    drawBlock(b);
  }

  // Move current block
  if (moving) {
    moving.x += moving.dir * speed;
    if (
      moving.x + moving.w / 2 >= towerCanvas.width ||
      moving.x - moving.w / 2 <= 0
    ) {
      moving.dir *= -1;
    }
    drawBlock(moving);
  }

  requestAnimationFrame(animate);
}

// 🧱 Draw a block
function drawBlock(b) {
  ctx.fillStyle = b.color;
  ctx.shadowColor = b.color;
  ctx.shadowBlur = 20;
  ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
  ctx.shadowBlur = 0;
}

// 🧱 Reset game
function resetGame() {
  startGame();
}

// 🎉 Win / lose popup
function showWin() {
  gameRunning = false;
  winPopup.classList.remove("hidden");
}

// 🎮 Event listeners
towerCanvas.addEventListener("click", dropBlock);
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") dropBlock();
});

resetBtn.addEventListener("click", resetGame);
menuBtn.addEventListener("click", () => {
  game.classList.add("hidden");
  menu.classList.add("active");
  winPopup.classList.add("hidden");
  gameRunning = false;
});

winRestart.addEventListener("click", () => {
  winPopup.classList.add("hidden");
  startGame();
});
winMain.addEventListener("click", () => {
  winPopup.classList.add("hidden");
  menu.classList.add("active");
  game.classList.add("hidden");
  gameRunning = false;
});

// 🕹️ Difficulty select
modeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    modeBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const mode = btn.getAttribute("data-speed");
    speed = mode === "slow" ? 3 : mode === "medium" ? 5 : 7;
    startBtn.disabled = false;
  });
});

// ▶ Start game
startBtn.addEventListener("click", () => {
  menu.classList.remove("active");
  game.classList.remove("hidden");
  winPopup.classList.add("hidden");
  startGame();
});
