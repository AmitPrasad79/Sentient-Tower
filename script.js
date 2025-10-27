// SENTIENT TOWER - script.js

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

// MODE SELECTION
modeBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    modeBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    gameSpeed = btn.dataset.speed;
    startBtn.disabled = false; // enable start button
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

  const rect = towerCanvas.getBoundingClientRect();
  towerCanvas.width = rect.width * window.devicePixelRatio;
  towerCanvas.height = rect.height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);


  blocks = [];
  score = 0;
  isRunning = true;
  winPopup.classList.add("hidden");

  // First base block
  const baseWidth = 200;
  const baseHeight = 20;
  const baseY = towerCanvas.height - baseHeight;
  blocks.push({ x: (towerCanvas.width - baseWidth) / 2, y: baseY, w: baseWidth, h: baseHeight });

  spawnNewBlock();
  requestAnimationFrame(update);
}

function spawnNewBlock() {
  if (!isRunning) return;
  const speed = gameSpeed === "easy" ? 2 : gameSpeed === "medium" ? 3.5 : 5;
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
  blocks.forEach(b => {
    ctx.fillRect(b.x, b.y, b.w, b.h);
  });

  // Move current block
  if (currentBlock) {
    currentBlock.x += currentBlock.speed * currentBlock.dir;
    if (currentBlock.x <= 0 || currentBlock.x + currentBlock.w >= towerCanvas.width) {
      currentBlock.dir *= -1;
    }
    ctx.fillRect(currentBlock.x, currentBlock.y, currentBlock.w, currentBlock.h);
  }

  requestAnimationFrame(update);
}

document.addEventListener("keydown", e => {
  if (e.code === "Space" || e.code === "ArrowDown") placeBlock();
});
towerCanvas.addEventListener("click", placeBlock);

function placeBlock() {
  if (!isRunning || !currentBlock) return;

  const prev = blocks[blocks.length - 1];
  const diff = currentBlock.x - prev.x;

  // If block too far off, game over
  if (Math.abs(diff) > prev.w) {
    gameOver();
    return;
  }

  // Trim block
  const overlap = prev.w - Math.abs(diff);
  if (overlap < 10) {
    gameOver();
    return;
  }

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
  winPopup.classList.remove("hidden");
  document.getElementById("win-text").innerText = `Your Score: ${score}`;
}

function restartGame() {
  gameScreen.classList.remove("hidden");
  menuScreen.classList.add("hidden");
  startGame();
}

function backToMenu() {
  gameScreen.classList.add("hidden");
  menuScreen.classList.add("active");
  startBtn.disabled = true;
  modeBtns.forEach(b => b.classList.remove("active"));
  winPopup.classList.add("hidden");
}
