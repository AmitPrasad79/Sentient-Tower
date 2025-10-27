const canvas = document.getElementById("towerCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 360;
canvas.height = 480;

let tower = [];
let currentBlock = null;
let gameRunning = false;
let moveDirection = 1;
let blockSpeed = 3;
let blockWidth = 120;
let blockHeight = 18;
let score = 0;
let bestScore = localStorage.getItem("bestTowerScore") || 0;

const scoreText = document.getElementById("score");
const bestText = document.getElementById("best");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const menuBtn = document.getElementById("menu-btn");
const modeBtns = document.querySelectorAll(".mode-btn");

let gameMode = "medium";

// =====================
//  MODE SELECTION
// =====================
modeBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    modeBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    gameMode = btn.dataset.mode;
    startBtn.disabled = false;
  });
});

// =====================
//  START GAME
// =====================
startBtn.addEventListener("click", () => {
  resetGame();
  startGame();
  document.getElementById("menu").classList.remove("active");
  document.getElementById("game").classList.add("active");
});

resetBtn.addEventListener("click", () => restartGame());
menuBtn.addEventListener("click", () => backToMenu());

function backToMenu() {
  resetGame();
  document.getElementById("game").classList.remove("active");
  document.getElementById("menu").classList.add("active");
}

// =====================
//  GAME LOGIC
// =====================
function startGame() {
  gameRunning = true;
  tower = [];

  // Set speed & width based on mode
  if (gameMode === "easy") {
    blockWidth = 140;
    blockSpeed = 2.4;
  } else if (gameMode === "medium") {
    blockWidth = 120;
    blockSpeed = 3;
  } else {
    blockWidth = 100;
    blockSpeed = 3.6;
  }

  score = 0;
  updateScore();
  addBaseBlock();
  addMovingBlock();
  requestAnimationFrame(update);
}

function resetGame() {
  gameRunning = false;
  tower = [];
  currentBlock = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function restartGame() {
  resetGame();
  startGame();
}

// =====================
//  BLOCK SYSTEM
// =====================
function addBaseBlock() {
  const baseY = canvas.height - blockHeight;
  tower.push({
    x: canvas.width / 2 - blockWidth / 2,
    y: baseY,
    width: blockWidth,
    color: getPinkShade()
  });
}

function addMovingBlock() {
  const y = tower[tower.length - 1].y - blockHeight;
  const startX = Math.random() > 0.5 ? -blockWidth : canvas.width;
  currentBlock = {
    x: startX,
    y: y,
    width: blockWidth,
    color: getPinkShade()
  };
  moveDirection = startX < 0 ? 1 : -1;
}

// =====================
//  UPDATE LOOP
// =====================
function update() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw tower
  tower.forEach(b => drawBlock(b.x, b.y, b.width, b.color));

  // Move current block
  currentBlock.x += blockSpeed * moveDirection;
  if (currentBlock.x <= -currentBlock.width || currentBlock.x >= canvas.width)
    moveDirection *= -1;

  drawBlock(currentBlock.x, currentBlock.y, currentBlock.width, currentBlock.color);
  requestAnimationFrame(update);
}

// =====================
//  CLICK TO DROP BLOCK
// =====================
canvas.addEventListener("click", placeBlock);
document.body.addEventListener("keydown", e => {
  if (e.code === "Space") placeBlock();
});

function placeBlock() {
  if (!gameRunning || !currentBlock) return;

  const prev = tower[tower.length - 1];
  const diff = currentBlock.x - prev.x;

  // If misaligned too much -> game over
  if (Math.abs(diff) >= currentBlock.width) {
    gameOver();
    return;
  }

  // Cut the block
  const overlap = currentBlock.width - Math.abs(diff);
  const newWidth = overlap;
  currentBlock.width = newWidth;

  if (diff > 0) currentBlock.x += diff;
  if (diff < 0) currentBlock.x -= Math.abs(diff);

  tower.push({ ...currentBlock });
  score++;
  updateScore();

  // Prepare next block
  addMovingBlock();
}

// =====================
//  DRAWING
// =====================
function drawBlock(x, y, width, color) {
  const gradient = ctx.createLinearGradient(x, y, x, y + blockHeight);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "#ff1a8c");
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, blockHeight);
  ctx.shadowBlur = 10;
  ctx.shadowColor = color;
}

// =====================
//  HELPERS
// =====================
function getPinkShade() {
  const shades = ["#ff66cc", "#ff99cc", "#ff4db8", "#ff80d5"];
  return shades[Math.floor(Math.random() * shades.length)];
}

function updateScore() {
  scoreText.textContent = `Score: ${score}`;
  bestText.textContent = `Best: ${bestScore}`;
}

function gameOver() {
  gameRunning = false;
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("bestTowerScore", bestScore);
  }

  const popup = document.getElementById("win");
  const text = document.getElementById("win-text");
  text.textContent = `You stacked ${score} blocks!`;
  popup.classList.remove("hidden");
}

// =====================
//  POPUP HANDLERS
// =====================
document.getElementById("win-restart").addEventListener("click", () => {
  document.getElementById("win").classList.add("hidden");
  restartGame();
});
document.getElementById("win-main").addEventListener("click", () => {
  document.getElementById("win").classList.add("hidden");
  backToMenu();
});
