document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const menuScreen = document.getElementById("menu");
  const gameScreen = document.getElementById("game");
  const startBtn = document.getElementById("start-btn");
  const modeBtns = document.querySelectorAll(".mode-btn");
  const resetBtn = document.getElementById("reset-btn");
  const menuBtn = document.getElementById("menu-btn");
  const towerCanvas = document.getElementById("towerCanvas");
  const scoreEl = document.getElementById("score");
  const winPopup = document.getElementById("win");
  const losePopup = document.getElementById("lose");
  const winMain = document.getElementById("win-main");
  const winRestart = document.getElementById("win-restart");
  const loseMain = document.getElementById("lose-main");
  const loseRestart = document.getElementById("lose-restart");

  const ctx = towerCanvas.getContext("2d");

  // Game state
  let W, H;
  let tower = [];
  let moving = null;
  let score = 0;
  let baseSpeed = 3;
  let speed = baseSpeed;
  const blockHeight = 25;
  let gameRunning = false;
  let raf;

  function resizeCanvas() {
    const rect = towerCanvas.parentElement.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    towerCanvas.width = W;
    towerCanvas.height = H;
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // Mode select
  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      modeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      startBtn.disabled = false;
      if (btn.dataset.speed === "slow") baseSpeed = 2;
      if (btn.dataset.speed === "medium") baseSpeed = 3.5;
      if (btn.dataset.speed === "fast") baseSpeed = 5;
    });
  });

  startBtn.addEventListener("click", () => {
    if (startBtn.disabled) return;
    menuScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    startGame();
  });

  function startGame() {
    cancelAnimationFrame(raf);
    resizeCanvas();
    tower = [];
    moving = null;
    score = 0;
    speed = baseSpeed;
    gameRunning = true;
    winPopup.classList.add("hidden");
    losePopup.classList.add("hidden");
    scoreEl.textContent = "Score: 0";
    initTower();
    loop();
  }

  function initTower() {
    const base = {
      x: W / 2,
      y: H - blockHeight / 2,
      w: W * 0.6,
      h: blockHeight,
    };
    tower.push(base);
    spawnMoving();
  }

  function spawnMoving() {
    const last = tower[tower.length - 1];
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? -last.w / 2 : W + last.w / 2;
    moving = {
      x: startX,
      y: last.y - blockHeight - 4,
      w: last.w,
      h: blockHeight,
      dir: fromLeft ? 1 : -1,
    };
    speed = baseSpeed + tower.length * 0.2;
  }

  function drawBlock(b, color = "#ff66cc") {
    ctx.fillStyle = color;
    ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const goalY = 80;
    ctx.strokeStyle = "#ffea00";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, goalY);
    ctx.lineTo(W, goalY);
    ctx.stroke();

    for (const b of tower) drawBlock(b);
    if (moving) {
      moving.x += moving.dir * speed;
      if (moving.x - moving.w / 2 <= 0 || moving.x + moving.w / 2 >= W)
        moving.dir *= -1;
      drawBlock(moving);
    }

    if (tower.length > 1) {
      const top = tower[tower.length - 1];
      if (top.y - top.h / 2 <= goalY) {
        winPopup.classList.remove("hidden");
        gameRunning = false;
        cancelAnimationFrame(raf);
        return;
      }
    }

    if (gameRunning) raf = requestAnimationFrame(loop);
  }

  function placeBlock() {
    if (!moving || !gameRunning) return;
    const top = tower[tower.length - 1];
    const left = Math.max(moving.x - moving.w / 2, top.x - top.w / 2);
    const right = Math.min(moving.x + moving.w / 2, top.x + top.w / 2);
    const overlap = right - left;

    if (overlap <= 0) {
      losePopup.classList.remove("hidden");
      cancelAnimationFrame(raf);
      gameRunning = false;
      return;
    }

    const newBlock = {
      x: (left + right) / 2,
      y: moving.y,
      w: overlap,
      h: blockHeight,
    };
    tower.push(newBlock);
    score++;
    scoreEl.textContent = `Score: ${score}`;
    moving = null;
    setTimeout(spawnMoving, 400);
  }

  towerCanvas.addEventListener("click", placeBlock);
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") placeBlock();
  });

  resetBtn.addEventListener("click", startGame);
  menuBtn.addEventListener("click", backToMenu);
  winMain.addEventListener("click", backToMenu);
  loseMain.addEventListener("click", backToMenu);
  winRestart.addEventListener("click", startGame);
  loseRestart.addEventListener("click", startGame);

  function backToMenu() {
    cancelAnimationFrame(raf);
    gameRunning = false;
    gameScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
  }
});
