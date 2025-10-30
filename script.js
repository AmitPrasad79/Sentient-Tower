document.addEventListener("DOMContentLoaded", () => {
  // DOM references
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

  // --- Game state ---
  let W, H;
  let tower = [];
  let moving = null;
  let score = 0;
  let baseSpeed = 3;
  let speed = baseSpeed;
  const blockHeight = 25;
  let gameRunning = false;
  let countdown = 3;
  let raf;

  // 🔧 Resize canvas to fit tower box
  function resizeCanvas() {
    const rect = towerCanvas.parentElement.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    towerCanvas.width = W;
    towerCanvas.height = H;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // 🎮 Difficulty selection
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

  // ▶ Start Game button
  startBtn.addEventListener("click", () => {
    if (startBtn.disabled) return; // safety
    menuScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    startGame();
  });

  // 🧱 Initialize game
  function startGame() {
    cancelAnimationFrame(raf);
    resizeCanvas();
    score = 0;
    speed = baseSpeed;
    tower = [];
    moving = null;
    gameRunning = false;
    countdown = 3;
    scoreEl.textContent = "Score: 0";
    winPopup.classList.add("hidden");
    losePopup.classList.add("hidden");
    runCountdown();
  }

  // ⏳ Countdown
  function runCountdown() {
    const timer = setInterval(() => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#ff66cc";
      ctx.font = `${H / 4}px Poppins`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(countdown > 0 ? countdown : "GO!", W / 2, H / 2);

      if (countdown < 0) {
        clearInterval(timer);
        initTower();
        gameRunning = true;
        loop();
      }
      countdown--;
    }, 1000);
  }

  // 🧱 Base block
  function initTower() {
    const base = {
      x: W / 2,
      y: H - blockHeight / 2,
      w: W * 0.6,
      h: blockHeight,
      color: "#ff66cc",
    };
    tower.push(base);
    spawnMoving();
  }

  // 🧱 Spawn moving block
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
      color: "#ff66cc",
    };
    speed = baseSpeed + Math.min(2, tower.length * 0.15);
  }

  // 🖌 Draw block
  function drawBlock(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = b.color;
    ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
    ctx.restore();
  }

  // 🎮 Loop
  function loop() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    // Draw goal line
    const goalY = 80;
    ctx.strokeStyle = "#ffea00";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, goalY);
    ctx.lineTo(W, goalY);
    ctx.stroke();
    ctx.font = "12px Poppins";
    ctx.fillStyle = "#ffea00";
    ctx.textAlign = "center";
    ctx.fillText("⭐ Goal Line", W / 2, goalY - 10);

    // Draw tower
    for (const b of tower) drawBlock(b);

    // Move and draw moving block
    if (moving && gameRunning) {
      moving.x += moving.dir * speed;
      if (moving.x - moving.w / 2 <= 0 || moving.x + moving.w / 2 >= W)
        moving.dir *= -1;
      drawBlock(moving);
    }

    // Win condition
    if (tower.length > 1) {
      const top = tower[tower.length - 1];
      if (top.y - top.h / 2 <= goalY) {
        cancelAnimationFrame(raf);
        gameRunning = false;
        showWinPopup();
        return;
      }
    }

    raf = requestAnimationFrame(loop);
  }

  // 🖱 Place block
  function placeBlock() {
    if (!gameRunning || !moving) return;

    const top = tower[tower.length - 1];
    const left = Math.max(moving.x - moving.w / 2, top.x - top.w / 2);
    const right = Math.min(moving.x + moving.w / 2, top.x + top.w / 2);
    const overlap = right - left;

    if (overlap <= 0) {
      cancelAnimationFrame(raf);
      gameRunning = false;
      showLosePopup();
      return;
    }

    const newBlock = {
      x: (left + right) / 2,
      y: moving.y,
      w: overlap,
      h: blockHeight,
      color: "#ff66cc",
    };
    tower.push(newBlock);
    score++;
    scoreEl.textContent = `Score: ${score}`;
    moving = null;
    setTimeout(spawnMoving, 300);
  }

  // 💥 Popups
  function showWinPopup() {
    winPopup.classList.remove("hidden");
  }

  function showLosePopup() {
    losePopup.classList.remove("hidden");
  }

  // 🧭 Controls
  towerCanvas.addEventListener("click", placeBlock);
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") placeBlock();
  });

  resetBtn.addEventListener("click", startGame);
  menuBtn.addEventListener("click", () => {
    cancelAnimationFrame(raf);
    gameRunning = false;
    gameScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
  });

  winMain.addEventListener("click", () => {
    winPopup.classList.add("hidden");
    gameScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
  });
  winRestart.addEventListener("click", startGame);

  loseMain.addEventListener("click", () => {
    losePopup.classList.add("hidden");
    gameScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
  });
  loseRestart.addEventListener("click", startGame);
});
