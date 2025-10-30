// script.js - Replace your current file with this
document.addEventListener("DOMContentLoaded", () => {
  // --- DOM refs ---
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
  // lose popup buttons (if present)
  const loseMain = document.getElementById("lose-main");
  const loseRestart = document.getElementById("lose-restart");

  const ctx = towerCanvas.getContext("2d");

  // --- Game state ---
  let W = 0, H = 0;
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

  // --- Resize canvas to visible tower-box size ---
  function resizeCanvas() {
    // use parent element bounding rect so canvas matches the visible box
    const rect = towerCanvas.parentElement.getBoundingClientRect();
    W = Math.max(100, Math.floor(rect.width));
    H = Math.max(100, Math.floor(rect.height));
    towerCanvas.width = W;
    towerCanvas.height = H;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // --- Difficulty selection enables start button ---
  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      modeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      startBtn.disabled = false;
      const spd = btn.dataset.speed;
      if (spd === "slow") baseSpeed = 2;
      else if (spd === "medium") baseSpeed = 3.5;
      else if (spd === "fast") baseSpeed = 5;
    });
  });

  // --- Start game (show game screen then start countdown) ---
  startBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (startBtn.disabled) return; // require difficulty pick

    // reset any running animation / timers
    cancelAnimationFrame(raf);
    clearInterval(countdownTimer);

    // reset logical state
    tower = [];
    moving = null;
    score = 0;
    scoreEl.textContent = "Score: 0";
    gameRunning = false;
    countdown = 3;
    if (winPopup) winPopup.classList.add("hidden");
    if (losePopup) losePopup.classList.add("hidden");

    // switch screens
    menuScreen.classList.add("hidden");
    menuScreen.classList.remove("active");
    gameScreen.classList.remove("hidden");
    gameScreen.classList.add("active");

    // give layout a beat, then resize and start the countdown
    setTimeout(() => {
      resizeCanvas();
      runCountdown();
    }, 80);
  });

  // --- Countdown visuals then init game ---
  function runCountdown() {
    countdown = 3;
    clearInterval(countdownTimer);

    countdownTimer = setInterval(() => {
      // draw centered countdown
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#ff66cc";
      ctx.font = `${Math.floor(H / 4)}px Poppins`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(countdown > 0 ? countdown : "GO!", W / 2, H / 2);

      if (countdown < 0) {
        clearInterval(countdownTimer);
        initTowerAndStart();
      }
      countdown--;
    }, 1000);
  }

  // --- Initialize base block and begin loop ---
  function initTowerAndStart() {
    cancelAnimationFrame(raf);
    tower = [];
    // base block centered at bottom
    const base = {
      x: W / 2,
      y: H - blockHeight / 2,
      w: Math.max(40, Math.floor(W * 0.6)),
      h: blockHeight,
      color: "#ff66cc"
    };
    tower.push(base);
    spawnMoving();
    gameRunning = true;
    loop();
  }

  // --- Spawn moving block off-screen from random side ---
  function spawnMoving() {
    const last = tower[tower.length - 1];
    if (!last) return;
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? -last.w / 2 - 5 : W + last.w / 2 + 5;
    moving = {
      x: startX,
      y: last.y - blockHeight - 4,
      w: last.w,
      h: blockHeight,
      dir: fromLeft ? 1 : -1,
      color: "#ff66cc"
    };
    // speed scales as tower grows
    speed = baseSpeed + Math.min(4, tower.length * 0.12);
  }

  // --- draw a block centered at (b.x,b.y) ---
  function drawBlock(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = b.color;
    ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
    ctx.restore();
  }

  // --- main animation loop ---
  function loop() {
    // clear + background
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    // draw goal line
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

    // draw stacked blocks
    for (const b of tower) drawBlock(b);

    // animate moving block when gameRunning
    if (moving) {
      if (gameRunning) {
        moving.x += moving.dir * speed;
        // bounce at edges so it stays reachable
        if (moving.x - moving.w / 2 <= 0) {
          moving.x = moving.w / 2;
          moving.dir *= -1;
        } else if (moving.x + moving.w / 2 >= W) {
          moving.x = W - moving.w / 2;
          moving.dir *= -1;
        }
      }
      drawBlock(moving);
    }

    // win check (top block crosses goal)
    if (gameRunning && tower.length > 1) {
      const top = tower[tower.length - 1];
      if (top.y - top.h / 2 <= goalHeight) {
        // win
        cancelAnimationFrame(raf);
        gameRunning = false;
        moving = null;
        showWin();
        return;
      }
    }

    raf = requestAnimationFrame(loop);
  }

  // --- place the moving block when player taps/clicks ---
  function placeBlock() {
    if (!gameRunning || !moving) return;

    const top = tower[tower.length - 1];
    const left = Math.max(moving.x - moving.w / 2, top.x - top.w / 2);
    const right = Math.min(moving.x + moving.w / 2, top.x + top.w / 2);
    const overlap = right - left;

    if (overlap <= 0) {
      // no overlap -> lose
      lose();
      return;
    }

    // new block is the overlapped piece
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

    // remove moving block and spawn next after a tiny delay
    moving = null;
    setTimeout(() => {
      // small safety: only spawn if still running
      if (gameRunning) spawnMoving();
    }, 220);
  }

  // --- win/lose handlers ---
  function showWin() {
    if (!winPopup) return;
    winPopup.querySelector("h2").textContent = "🎉 You Win!";
    const textEl = winPopup.querySelector("#win-text");
    if (textEl) textEl.textContent = "You reached the Goal Line!";
    winPopup.classList.remove("hidden");
  }

  function lose() {
    if (!losePopup && !winPopup) return;
    // prefer dedicated lose popup if present, otherwise reuse winPopup with lose text
    if (losePopup) {
      losePopup.classList.remove("hidden");
    } else {
      winPopup.querySelector("h2").textContent = "💀 You Lose!";
      const textEl = winPopup.querySelector("#win-text");
      if (textEl) textEl.textContent = "Your tower collapsed!";
      winPopup.classList.remove("hidden");
    }
    cancelAnimationFrame(raf);
    gameRunning = false;
    moving = null;
  }

  // --- Controls & buttons ---
  towerCanvas.addEventListener("click", placeBlock);
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") placeBlock();
  });

  resetBtn.addEventListener("click", () => {
    // Quick reset: go back to menu for clarity
    cancelAnimationFrame(raf);
    clearInterval(countdownTimer);
    if (winPopup) winPopup.classList.add("hidden");
    if (losePopup) losePopup.classList.add("hidden");
    tower = [];
    moving = null;
    score = 0;
    scoreEl.textContent = "Score: 0";
    gameRunning = false;
    countdown = 3;
    menuScreen.classList.remove("hidden");
    menuScreen.classList.add("active");
    gameScreen.classList.add("hidden");
    gameScreen.classList.remove("active");
  });

  // menu button brings you back to menu and stops animation
  menuBtn.addEventListener("click", () => {
    cancelAnimationFrame(raf);
    clearInterval(countdownTimer);
    gameRunning = false;
    moving = null;
    if (winPopup) winPopup.classList.add("hidden");
    if (losePopup) losePopup.classList.add("hidden");
    gameScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
    menuScreen.classList.add("active");
  });

  // popup buttons
  if (winMain) winMain.addEventListener("click", () => {
    if (winPopup) winPopup.classList.add("hidden");
    gameScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
  });
  if (winRestart) winRestart.addEventListener("click", () => {
    if (winPopup) winPopup.classList.add("hidden");
    // start fresh
    setTimeout(() => {
      resizeCanvas();
      runCountdown();
    }, 60);
  });

  if (loseMain) loseMain.addEventListener("click", () => {
    if (losePopup) losePopup.classList.add("hidden");
    gameScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
  });
  if (loseRestart) loseRestart.addEventListener("click", () => {
    if (losePopup) losePopup.classList.add("hidden");
    setTimeout(() => {
      resizeCanvas();
      runCountdown();
    }, 60);
  });

  // safety: initial canvas size
  resizeCanvas();
});
