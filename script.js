document.addEventListener("DOMContentLoaded", () => {
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
  let W, H;
  let tower = [];
  let moving = null;
  let score = 0;
  let speed = 3;
  const blockHeight = 25;
  let gameRunning = false;
  let countdown = 3;
  let countdownTimer = null;

  function resizeCanvas() {
    const rect = towerCanvas.parentElement.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    towerCanvas.width = W;
    towerCanvas.height = H;
  }

  window.addEventListener("resize", () => {
    resizeCanvas();
    if (!gameRunning) drawIdle();
  });

  resizeCanvas();
  drawIdle();

  function drawIdle() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ff66cc55";
    ctx.textAlign = "center";
    ctx.font = "24px Poppins";
    ctx.fillText("Waiting to start...", W / 2, H / 2);
  }

  // Difficulty
  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      modeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      startBtn.disabled = false;
      if (btn.dataset.speed === "slow") speed = 2;
      if (btn.dataset.speed === "medium") speed = 3.5;
      if (btn.dataset.speed === "fast") speed = 5;
    });
  });

  startBtn.addEventListener("click", (e) => {
    e.preventDefault();
    menuScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    startGame();
  });

  function startGame() {
    score = 0;
    tower = [];
    moving = null;
    gameRunning = false;
    winPopup.classList.add("hidden");
    scoreEl.textContent = "Score: 0";
    countdown = 3;
    resizeCanvas();
    runCountdown();
  }

  function runCountdown() {
    clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#ff66cc";
      ctx.font = `${H / 4}px Poppins`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const text = countdown > 0 ? countdown : "GO!";
      ctx.fillText(text, W / 2, H / 2);

      countdown--;
      if (countdown < -1) {
        clearInterval(countdownTimer);
        gameRunning = true;
        initTower();
        requestAnimationFrame(loop);
      }
    }, 1000);
  }

  function initTower() {
    tower = [];
    const base = { x: W / 2, y: H - blockHeight / 2, w: W * 0.6, h: blockHeight, color: "#ff66cc" };
    tower.push(base);
    spawnMoving();
  }

  function spawnMoving() {
    const last = tower[tower.length - 1];
    moving = {
      x: 0,
      y: last.y - blockHeight - 4,
      w: last.w,
      h: blockHeight,
      dir: 1,
      color: "#ff66cc"
    };
  }

  function loop() {
    if (!gameRunning) return;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    // move
    if (moving) {
      moving.x += moving.dir * speed;
      if (moving.x - moving.w / 2 < 0 || moving.x + moving.w / 2 > W) moving.dir *= -1;
    }

    for (const b of tower) drawBlock(b);
    if (moving) drawBlock(moving);

    requestAnimationFrame(loop);
  }

  function drawBlock(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = b.color;
    ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
    ctx.restore();
  }

  function placeBlock() {
    if (!gameRunning || !moving) return;
    const top = tower[tower.length - 1];
    const left = Math.max(moving.x - moving.w / 2, top.x - top.w / 2);
    const right = Math.min(moving.x + moving.w / 2, top.x + top.w / 2);
    const overlap = right - left;

    if (overlap <= 0) return gameOver();

    const newBlock = {
      x: (left + right) / 2,
      y: moving.y,
      w: overlap,
      h: blockHeight,
      color: "#ff66cc"
    };
    tower.push(newBlock);
    score++;
    scoreEl.textContent = `Score: ${score}`;
    tower.forEach((b) => (b.y += blockHeight + 4));
    moving = null;
    setTimeout(spawnMoving, 200);
  }

  function gameOver() {
    gameRunning = false;
    winPopup.classList.remove("hidden");
  }

  towerCanvas.addEventListener("click", placeBlock);
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") placeBlock();
  });

  resetBtn.addEventListener("click", () => startGame());
  menuBtn.addEventListener("click", () => {
    gameScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
  });

  winMain.addEventListener("click", () => {
    winPopup.classList.add("hidden");
    gameScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
  });

  winRestart.addEventListener("click", () => {
    winPopup.classList.add("hidden");
    startGame();
  });
});
