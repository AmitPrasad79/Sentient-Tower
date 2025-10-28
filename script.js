document.addEventListener("DOMContentLoaded", () => {
  // === Grab elements ===
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
  let speed = 100; // Default easy
  const blockHeight = 32;
  let gameRunning = false;

  // === Fix: ensure canvas fills container ===
  function resizeCanvas() {
    const rect = towerCanvas.parentElement.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    towerCanvas.width = W * devicePixelRatio;
    towerCanvas.height = H * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // === Difficulty selection ===
  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      modeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      startBtn.disabled = false;

      if (btn.dataset.speed === "slow") speed = 100;
      if (btn.dataset.speed === "medium") speed = 180;
      if (btn.dataset.speed === "fast") speed = 250;
    });
  });

  // === Start button ===
  startBtn.addEventListener("click", () => {
    menuScreen.classList.remove("active");
    menuScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    gameScreen.classList.add("active");

    startGame();
  });

  // === Start game core ===
  function startGame() {
    score = 0;
    scoreEl.textContent = "Score: 0";
    tower = [];
    moving = null;
    gameRunning = false;
    winPopup.classList.add("hidden");
    startCountdown();
  }

  // === Countdown (3..2..1..GO!) ===
  function startCountdown() {
    let count = 3;
    const timer = setInterval(() => {
      drawCountdown(count);
      count--;
      if (count < 0) {
        clearInterval(timer);
        gameRunning = true;
        initTower();
      }
    }, 1000);
  }

  // === Draw countdown ===
  function drawCountdown(n) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#ff66cc";
    ctx.font = `${H / 3}px 'Poppins', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(n > 0 ? n : "GO!", W / 2, H / 2);
  }

  // === Initialize tower ===
  function initTower() {
    const base = { x: W / 2, y: H - blockHeight / 2, w: W * 0.6, h: blockHeight };
    tower.push(base);
    spawnMoving();
    loop();
  }

  // === Spawn moving block ===
  function spawnMoving() {
    const last = tower[tower.length - 1];
    moving = {
      x: W / 2, // <--- FIXED: start from center
      y: last.y - blockHeight - 4,
      w: last.w,
      h: blockHeight,
      dir: 1,
      color: "#ff66cc"
    };
  }

  // === Draw loop ===
  function loop() {
    ctx.fillStyle = "#000"; // black background for visibility
    ctx.fillRect(0, 0, W, H);

    if (moving && gameRunning) {
      moving.x += moving.dir * (speed * 0.016);
      if (moving.x - moving.w / 2 < 0 || moving.x + moving.w / 2 > W) {
        moving.dir *= -1;
      }
    }

    for (const b of tower) drawBlock(b);
    if (moving) drawBlock(moving);

    requestAnimationFrame(loop);
  }

  // === Draw block ===
  function drawBlock(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = b.color;
    ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
    ctx.restore();
  }

  // === Place block (space or click) ===
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") placeBlock();
  });
  towerCanvas.addEventListener("click", placeBlock);

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
      color: "#ff66cc"
    };

    tower.push(newBlock);
    score++;
    scoreEl.textContent = "Score: " + score;

    // Move tower up
    for (const b of tower) b.y += blockHeight + 4;
    moving = null;
    setTimeout(spawnMoving, 200);
  }

  // === Game over ===
  function gameOver() {
    gameRunning = false;
    winPopup.classList.remove("hidden");
  }

  // === Buttons ===
  resetBtn.addEventListener("click", () => {
    winPopup.classList.add("hidden");
    startGame();
  });

  menuBtn.addEventListener("click", () => {
    gameScreen.classList.add("hidden");
    gameScreen.classList.remove("active");
    menuScreen.classList.remove("hidden");
    menuScreen.classList.add("active");
  });

  winMain.addEventListener("click", () => {
    winPopup.classList.add("hidden");
    gameScreen.classList.add("hidden");
    gameScreen.classList.remove("active");
    menuScreen.classList.remove("hidden");
    menuScreen.classList.add("active");
  });

  winRestart.addEventListener("click", () => {
    winPopup.classList.add("hidden");
    startGame();
  });
});
