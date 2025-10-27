// SENTIENT TOWER - FIXED SCRIPT
const canvas = document.getElementById("towerCanvas");
const ctx = canvas.getContext("2d");

// ✅ Always match the canvas size to the visible box
function resizeCanvas() {
  const box = document.querySelector(".tower-box");
  canvas.width = box.clientWidth;
  canvas.height = box.clientHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const menuScreen = document.getElementById("menu");
const gameScreen = document.getElementById("game");
const startBtn = document.getElementById("start-btn");
const modeBtns = document.querySelectorAll(".mode-btn");
const resetBtn = document.getElementById("reset-btn");
const menuBtn = document.getElementById("menu-btn");
const scoreDisplay = document.getElementById("score");
const winPopup = document.getElementById("win");
const winMain = document.getElementById("win-main");
const winRestart = document.getElementById("win-restart");

let gameSpeed = "medium";
let towerCanvas, ctx;
let blocks = [];
let currentBlock = null;
let score = 0;
let isRunning = false;
let animationId = null;

// MODE SELECTION
modeBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    modeBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    gameSpeed = btn.dataset.speed; // "slow", "medium", "fast"
    startBtn.disabled = false;
  });
});

// START GAME
startBtn.addEventListener("click", () => {
  menuScreen.classList.remove("active");
  menuScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  startGame();
});

menuBtn.addEventListener("click", backToMenu);
resetBtn.addEventListener("click", restartGame);
winMain.addEventListener("click", backToMenu);
winRestart.addEventListener("click", restartGame);

function startGame() {
  towerCanvas = document.getElementById("towerCanvas");
  ctx = towerCanvas.getContext("2d");

  // FIX: set logical resolution same as CSS size (no pixel ratio scaling)
  const rect = towerCanvas.getBoundingClientRect();
  towerCanvas.width = rect.width;
  towerCanvas.height = rect.height;

  // now game area fills full inner rectangle visually
  ctx.imageSmoothingEnabled = false;

  blocks = [];
  score = 0;
  isRunning = true;
  winPopup.classList.add("hidden");
  scoreDisplay.textContent = "Score: 0";

  // Base block
  const baseWidth = towerCanvas.width * 0.6;
  const baseHeight = 20;
  const baseY = towerCanvas.height - baseHeight - 10;
  blocks.push({ x: (towerCanvas.width - baseWidth) / 2, y: baseY, w: baseWidth, h: baseHeight });

  // Attach click only when game is active
  towerCanvas.onclick = placeBlock;

  spawnNewBlock();
  update();
}

function spawnNewBlock() {
  if (!isRunning) return;
  const speed =
    gameSpeed === "slow" ? 2 :
    gameSpeed === "medium" ? 3.5 :
    5;

  const width = blocks[blocks.length - 1].w;
  const x = Math.random() < 0.5 ? 0 : towerCanvas.width - width;
  const y = 0;
  currentBlock = { x, y, w: width, h: 20, dir: x === 0 ? 1 : -1, speed };
}

function update() {
  if (!isRunning) return;
  ctx.clearRect(0, 0, towerCanvas.width, towerCanvas.height);

  // Draw existing blocks
  ctx.fillStyle = "#ff66cc";
  blocks.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

  // Move and draw current block
  if (currentBlock) {
    currentBlock.x += currentBlock.speed * currentBlock.dir;
    if (currentBlock.x <= 0 || currentBlock.x + currentBlock.w >= towerCanvas.width)
      currentBlock.dir *= -1;
    ctx.fillRect(currentBlock.x, currentBlock.y, currentBlock.w, currentBlock.h);
  }

  animationId = requestAnimationFrame(update);
}

function placeBlock() {
  if (!isRunning || !currentBlock) return;

  const prev = blocks[blocks.length - 1];
  const diff = currentBlock.x - prev.x;

  if (Math.abs(diff) > prev.w) return gameOver();

  const overlap = prev.w - Math.abs(diff);
  if (overlap < 10) return gameOver();

  const newBlock = {
    x: diff >= 0 ? currentBlock.x : prev.x,
    y: prev.y - 20,
    w: overlap,
    h: 20
  };

  blocks.push(newBlock);
  score++;
  scoreDisplay.textContent = `Score: ${score}`;
  currentBlock = null;
  spawnNewBlock();
}

function gameOver() {
  isRunning = false;
  cancelAnimationFrame(animationId);
  winPopup.classList.remove("hidden");
  document.getElementById("win-text").innerText = `Your Score: ${score}`;
}

function restartGame() {
  gameScreen.classList.remove("hidden");
  menuScreen.classList.add("hidden");
  cancelAnimationFrame(animationId);
  startGame();
}

function backToMenu() {
  isRunning = false;
  cancelAnimationFrame(animationId);
  gameScreen.classList.add("hidden");
  menuScreen.classList.add("active");
  startBtn.disabled = true;
  modeBtns.forEach(b => b.classList.remove("active"));
  winPopup.classList.add("hidden");
}
