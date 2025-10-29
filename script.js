// script.js — cleaned, robust, ready-to-drop-in
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
  let W = 0, H = 0;
  let tower = [];
  let moving = null;
  let score = 0;
  let speed = 3;
  const blockHeight = 25;
  let gameRunning = false;
  let countdown = 3;
  let raf = null;
  let countdownTimer = null;

  function setVisibleMenu(show) {
    if (show) {
      menuScreen.classList.remove("hidden");
      menuScreen.classList.add("active");
      gameScreen.classList.remove("active");
      gameScreen.classList.add("hidden");
    } else {
      menuScreen.classList.remove("active");
      menuScreen.classList.add("hidden");
      gameScreen.classList.remove("hidden");
      gameScreen.classList.add("active");
    }
  }

  function resizeCanvas() {
    // Size canvas to the tower-box element
    const rect = towerCanvas.parentElement.getBoundingClientRect();
    W = Math.round(rect.width);
    H = Math.round(rect.height);
    // set canvas pixel dimensions to match CSS pixels
    towerCanvas.width = W;
    towerCanvas.height = H;
  }
  window.addEventListener("resize", () => {
    resizeCanvas();
    // Redraw current frame immediately
    drawFrame();
  });

  // Difficulty buttons
  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      modeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      startBtn.disabled = false; // allow start after difficulty chosen

      if (btn.dataset.speed === "slow") speed = 2;
      if (btn.dataset.speed === "medium") speed = 3.5;
      if (btn.dataset.speed === "fast") speed = 5;
    });
  });

  // Start Game button
  startBtn.addEventListener("click", (e) => {
    e.preventDefault();
    setVisibleMenu(false);
    startGame();
  });

  // Start / reset the game state
  function startGame() {
    cancelAnimationFrame(raf);
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    tower = [];
    moving = null;
    score = 0;
    scoreEl.textContent = "Score: 0";
    countdown = 3;
    gameRunning = false;
    winPopup.classList.add("hidden");
    resizeCanvas();
    runCountdown();
  }

  // Countdown 3..2..1..GO!
  function runCountdown() {
    // Ensure canvas cleared so countdown is visible each second
    countdownTimer = setInterval(() => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#ff66cc";
      ctx.font = `${Math.floor(H / 4)}px Poppins, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(countdown > 0 ? countdown : "GO!", W / 2, H / 2);

      if (countdown < 0) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        initTower();
        gameRunning = true;
        // start the continuous loop (guaranteed)
        loop();
      }
      countdown--;
    }, 1000);
  }

  // Create initial base block and spawn first moving block
  function initTower() {
    const base = {
      x: W / 2,
      y: H - blockHeight / 2,
      w: Math.max(40, W * 0.6), // ensure not too narrow
      h: blockHeight,
      color: "#ff66cc",
    };
    tower = [base];
    spawnMoving();
  }

  // Spawn moving block: random left or right start, random dir
  function spawnMoving() {
    if (!tower.length) return;
    const last = tower[tower.length - 1];
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? -last.w / 2 - 10 : W + last.w / 2 + 10;
    moving = {
      x: startX,
      y: last.y - blockHeight - 4,
      w: last.w,
      h: blockHeight,
      dir: fromLeft ? 1 : -1,
      color: "#ff66cc",
    };
    // speed grows slightly as player stacks
    speed = Math.min(7, 2 + tower.length * 0.15);
  }

  // draw single block helper
  function drawBlock(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = b.color;
    ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
    ctx.restore();
  }

  // draw the goal line + frame background
  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    // goal line
    const goalHeight = 80;
    ctx.strokeStyle = "#ffea00";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, goalHeight);
    ctx.lineTo(W, goalHeight);
    ctx.stroke();

    ctx.fillStyle = "#ffea00";
    ctx.font = "12px Poppins, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⭐ Goal Line", W / 2, goalHeight - 10);
  }

  // Main loop
  function loop() {
    // always draw frame + tower + moving
    drawFrame();

    // draw existing stack
    for (const b of tower) drawBlock(b);

    // animate moving block if present and gameRunning
    if (moving) {
      if (gameRunning) {
        moving.x += moving.dir * speed;
        // bounce off edges so player can always catch it
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

    // Win check: top block crossing goal
    if (tower.length > 1 && gameRunning) {
      const topBlock = tower[tower.length - 1];
      const goalHeight = 80;
      if (topBlock.y - topBlock.h / 2 <= goalHeight) {
        // win
        cancelAnimationFrame(raf);
        gameRunning = false;
        moving = null;
        showWinPopup();
        return;
      }
    }

    // continue animation
    raf = requestAnimationFrame(loop);
  }

  // Place a block when player clicks/presses space
  function placeBlock() {
    if (!gameRunning || !moving) return;

    const top = tower[tower.length - 1];
    const left = Math.max(moving.x - moving.w / 2, top.x - top.w / 2);
    const right = Math.min(moving.x + moving.w / 2, top.x + top.w / 2);
    const overlap = right - left;

    if (overlap <= 0) {
      // miss -> lose
      gameOver();
      return;
    }

    // create new trimmed block representing overlap
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

    // clear active moving block then spawn next after a short delay
    moving = null;
    setTimeout(() => {
      spawnMoving();
      // ensure loop is running
      if (!raf) loop();
    }, 260);
  }

  // show win/lose
  function showWinPopup() {
    winPopup.querySelector("h2").textContent = "🎉 You Win!";
    const winText = winPopup.querySelector("#win-text");
    if (winText) winText.textContent = "You reached the Goal Line!";
    winPopup.classList.remove("hidden");
  }
  function showLosePopup() {
    winPopup.querySelector("h2").textContent = "💀 You Lose!";
    const winText = winPopup.querySelector("#win-text");
    if (winText) winText.textContent = "Your tower collapsed!";
    winPopup.classList.remove("hidden");
  }

  function gameOver() {
    cancelAnimationFrame(raf);
    raf = null;
    gameRunning = false;
    moving = null;
    showLosePopup();
  }

  // Controls
  towerCanvas.addEventListener("click", placeBlock);
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      placeBlock();
    }
  });

  resetBtn.addEventListener("click", () => {
    startGame();
  });

  // single clean menu handler
  menuBtn.addEventListener("click", () => {
    cancelAnimationFrame(raf);
    raf = null;
    gameRunning = false;
    moving = null;
    winPopup.classList.add("hidden");
    setVisibleMenu(true);
    // clear canvas for cleanliness
    ctx.clearRect(0, 0, W, H);
  });

  winMain.addEventListener("click", () => {
    winPopup.classList.add("hidden");
    cancelAnimationFrame(raf);
    raf = null;
    gameRunning = false;
    moving = null;
    setVisibleMenu(true);
    ctx.clearRect(0, 0, W, H);
  });

  winRestart.addEventListener("click", () => {
    winPopup.classList.add("hidden");
    startGame();
  });

  // initial UI state
  resizeCanvas();
  setVisibleMenu(true);
  startBtn.disabled = true;
});
