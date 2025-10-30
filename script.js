document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
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

  // --- Game State ---
  let W, H;
  let tower = [];
  let moving = null;
  let score = 0;
  let baseSpeed = 3;
  let speed = baseSpeed;
  const blockHeight = 25;
  let gameRunning = false;
  let countdown = 3;
  let raf = null;
  let countdownTimer = null;

  // --- Utility ---
  function resizeCanvas() {
    const rect = towerCanvas.parentElement.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    towerCanvas.width = W;
    towerCanvas.height = H;
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // --- Difficulty Selection ---
  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      modeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      startBtn.disabled = false;

      const spd = btn.dataset.speed;
      if (spd === "slow") baseSpeed = 2;
      else if (spd === "medium") baseSpeed = 3.5;
      else if (spd === "fast") baseSpeed = 5;
    });
  });

  // --- Start Game ---
  startBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (startBtn.disabled) return;

    // Reset all game state
    cancelAnimationFrame(raf);
    clearInterval(countdownTimer);
    tower = [];
    moving = null;
    score = 0;
    scoreEl.textContent = "Score: 0";
    gameRunning = false;
    countdown = 3;
    winPopup.classList.add("hidden");

    // Switch screens
    menuScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    gameScreen.classList.add("active");

    // Prepare canvas and run countdown
    setTimeout(() => {
      resizeCanvas();
      runCountdown();
    }, 100);
  });

  // --- Countdown ---
  function runCountdown() {
    countdown = 3;
    clearInterval(countdownTimer);

    countdownTimer = setInterval(() => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#ff66cc";
      ctx.font = `${H / 4}px Poppins`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(countdown > 0 ? countdown : "GO!", W / 2, H / 2);

      if (countdown < 0) {
        clearInterval(countdownTimer);
        startGame();
      }
      countdown--;
    }, 1000);
  }

  // --- Game Initialization ---
  function startGame() {
    cancelAnimationFrame(raf);
    tower = [];
    moving = null;
    score = 0;
    scoreEl.textContent = "Score: 0";
    gameRunning = true;
    winPopup.classList.add("hidden");
    ctx.clearRect(0, 0, W, H);

    const base = {
      x: W / 2,
      y: H - blockHeight / 2,
      w: W * 0.6,
      h: blockHeight,
      color: "#ff66cc",
    };
    tower.push(base);
    spawnMoving();
    loop();
  }

  // --- Spawn Moving Block ---
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

  // make sure game is running before animating
  gameRunning = true;
  speed = baseSpeed + tower.length * 0.25;
  raf = requestAnimationFrame(loop);
}

  // --- Draw Block ---
  function drawBlock(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = b.color;
    ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
    ctx.restore();
  }

  // --- Main Loop ---
  function loop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
  
    const goalHeight = 80;
    ctx.strokeStyle = "#ffea00";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, goalHeight);
    ctx.lineTo(W, goalHeight);
    ctx.stroke();
    ctx.fillStyle = "#ffea00";
    ctx.font = "12px Poppins";
    ctx.textAlign = "center";
    ctx.fillText("⭐ Goal Line", W / 2, goalHeight - 10);

    // Draw all stacked blocks
    for (const b of tower) drawBlock(b);

    // Move current block
    if (moving) {
      moving.x += moving.dir * speed;
      if (moving.x - moving.w / 2 <= 0 || moving.x + moving.w / 2 >= W) {
        moving.dir *= -1;
      }
      drawBlock(moving);
    }

  // Win check
  if (tower.length > 1) {
    const topBlock = tower[tower.length - 1];
    if (topBlock.y - topBlock.h / 2 <= goalHeight) {
      winGame();
      return;
    }
  }

  raf = requestAnimationFrame(loop);
}

  // --- Place Block ---
  function placeBlock() {
    if (!gameRunning || !moving) return;

    const top = tower[tower.length - 1];
    const left = Math.max(moving.x - moving.w / 2, top.x - top.w / 2);
    const right = Math.min(moving.x + moving.w / 2, top.x + top.w / 2);
    const overlap = right - left;

    if (overlap <= 0) return loseGame();

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

  // --- Win / Lose ---
  function winGame() {
    cancelAnimationFrame(raf);
    gameRunning = false;
    moving = null;
    winPopup.querySelector("h2").textContent = "🎉 You Win!";
    winPopup.querySelector("#win-text").textContent = "You reached the Goal Line!";
    winPopup.classList.remove("hidden");
  }

  function loseGame() {
    cancelAnimationFrame(raf);
    gameRunning = false;
    moving = null;
    winPopup.querySelector("h2").textContent = "💀 You Lose!";
    winPopup.querySelector("#win-text").textContent = "Your tower collapsed!";
    winPopup.classList.remove("hidden");
  }

  // --- Controls ---
  towerCanvas.addEventListener("click", placeBlock);
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") placeBlock();
  });

  resetBtn.addEventListener("click", startGame);
  menuBtn.addEventListener("click", () => {
    cancelAnimationFrame(raf);
    clearInterval(countdownTimer);
    gameRunning = false;
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
