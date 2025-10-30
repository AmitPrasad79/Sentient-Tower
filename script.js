// script.js — improved/responsive version for Sentient Tower
document.addEventListener("DOMContentLoaded", () => {
  // UI
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

  // canvas context
  const ctx = towerCanvas.getContext("2d");

  // game state
  let W = 0, H = 0;
  let tower = [];           // array of blocks (each block: {x(center), y(center), w, h, color})
  let moving = null;        // moving block object (same shape)
  let speed = 3;            // pixels per frame base (adjusted by difficulty / stack)
  const blockHeight = 25;
  let gameRunning = false;
  let countdown = 3;
  let raf = null;
  let countdownTimer = null;

  // --- Resize canvas to fit the tower-box and account for DPR ---
  function resizeCanvas() {
    const rect = towerCanvas.parentElement.getBoundingClientRect();
    W = Math.floor(rect.width);
    H = Math.floor(rect.height);

    const dpr = window.devicePixelRatio || 1;
    towerCanvas.width = Math.max(1, Math.floor(W * dpr));
    towerCanvas.height = Math.max(1, Math.floor(H * dpr));
    // scale drawing operations so CSS width/height units work naturally
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", () => {
    resizeCanvas();
    // If running, redraw immediately so things look correct
    if (gameRunning) drawFrame();
  });

  // initial size
  resizeCanvas();

  // --- Difficulty buttons ---
  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      modeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      startBtn.disabled = false;
      const s = btn.dataset.speed;
      if (s === "slow") speed = 2;
      if (s === "medium") speed = 3.5;
      if (s === "fast") speed = 5;
    });
  });

  // --- Start button ---
  startBtn.addEventListener("click", (e) => {
    e.preventDefault();
    // hide menu, show game
    menuScreen.classList.add("hidden");
    menuScreen.classList.remove("active");
    gameScreen.classList.remove("hidden");
    gameScreen.classList.add("active");

    // ensure canvas is resized after layout change
    setTimeout(() => {
      resizeCanvas();
      startGame();
    }, 40);
  });

  // --- Start / reset game ---
  function startGame() {
    cancelAll();
    tower = [];
    moving = null;
    gameRunning = false;
    countdown = 3;
    scoreEl.textContent = "Score: 0";
    winPopup.classList.add("hidden");
    losePopup.classList.add("hidden");
    runCountdown();
  }

  function cancelAll() {
    if (raf) cancelAnimationFrame(raf);
    if (countdownTimer) clearInterval(countdownTimer);
    raf = null;
    countdownTimer = null;
  }

  // --- Countdown display ---
  function runCountdown() {
    countdown = 3;
    countdownTimer = setInterval(() => {
      drawFrame(true); // draw large countdown text over cleared canvas
      countdown--;
      if (countdown < 0) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        initTower();
        gameRunning = true;
        loop();
      }
    }, 1000);
  }

  // Draw either game frame or countdown big text when calling with countdown mode
  function drawFrame(showCountdown = false) {
    // clear
    ctx.clearRect(0, 0, W, H);
    // background
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
    ctx.font = "12px Poppins, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⭐ Goal Line", W / 2, goalHeight - 10);

    // draw tower blocks
    for (const b of tower) drawBlock(b);

    // draw moving block if present
    if (moving) drawBlock(moving);

    // optionally draw big countdown
    if (showCountdown) {
      ctx.fillStyle = "#ff66cc";
      // choose font size relative to H
      const fontSize = Math.max(24, Math.floor(H / 4));
      ctx.font = `${fontSize}px Poppins, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(countdown > 0 ? countdown : "GO!", W / 2, H / 2);
    }
  }

  // --- Initialize base block and spawn first moving block ---
  function initTower() {
    tower = [];
    const base = {
      // we use center coordinates for drawBlock (because drawBlock translates to x,y)
      x: W / 2,
      y: H - blockHeight / 2 - 6, // slight inset from bottom
      w: Math.max(80, W * 0.6),
      h: blockHeight,
      color: "#ff66cc"
    };
    tower.push(base);
    spawnMoving();
  }

  // --- Spawn moving block (center-based coordinates) ---
  function spawnMoving() {
    const last = tower[tower.length - 1];
    const fromLeft = Math.random() < 0.5;

    // last.w is width; moving.x is center coordinate
    const startCenterX = fromLeft ? -last.w / 2 - 10 : W + last.w / 2 + 10;

    moving = {
      x: startCenterX,
      y: last.y - last.h - 4, // position above the last block
      w: last.w,
      h: last.h,
      dir: fromLeft ? 1 : -1,
      color: "#ff66cc"
    };

    // gradually increase speed a bit as tower grows (keeps gameplay progressive)
    // but keep base difficulty selected earlier by user in `speed`
    const growthSpeed = Math.min(2.5, Math.max(0, tower.length * 0.08));
    moving._speed = speed + growthSpeed;
  }

  // --- Draw a block (center-based pos) ---
  function drawBlock(b) {
    ctx.save();
    // draw using center coordinates as your original drawBlock expects
    ctx.translate(b.x, b.y);
    ctx.fillStyle = b.color;
    ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
    ctx.restore();
  }

  // --- Game loop ---
  function loop() {
    // cancel previous RAF (safe)
    if (raf) cancelAnimationFrame(raf);

    // update positions
    if (moving && gameRunning) {
      moving.x += moving.dir * (moving._speed ?? speed);

      // bounce when center +- half width goes beyond canvas
      if (moving.x - moving.w / 2 <= 0) {
        moving.x = moving.w / 2;
        moving.dir *= -1;
      } else if (moving.x + moving.w / 2 >= W) {
        moving.x = W - moving.w / 2;
        moving.dir *= -1;
      }
    }

    // redraw
    drawFrame();

    // check win (top of tower reaches goal line)
    if (gameRunning && tower.length > 0) {
      const topBlock = tower[tower.length - 1];
      if (topBlock.y - topBlock.h / 2 <= 80) {
        // win
        gameRunning = false;
        moving = null;
        cancelAnimationFrame(raf);
        showWinPopup();
        return;
      }
    }

    raf = requestAnimationFrame(loop);
  }

  // --- Place block logic (when player clicks/taps) ---
  function placeBlock() {
    if (!gameRunning || !moving) return;

    const topIndex = tower.length - 1;
    const baseBlock = tower[topIndex]; // the block below (last pushed)
    // Calculate overlap between moving and base using left / right edges
    const movingLeft = moving.x - moving.w / 2;
    const movingRight = moving.x + moving.w / 2;
    const baseLeft = baseBlock.x - baseBlock.w / 2;
    const baseRight = baseBlock.x + baseBlock.w / 2;

    const left = Math.max(movingLeft, baseLeft);
    const right = Math.min(movingRight, baseRight);
    const overlap = right - left;

    // if no overlap -> game over (lose)
    if (overlap <= 0) {
      gameOver();
      return;
    }

    // create new block that is the overlapped portion (center coords)
    const newW = overlap;
    const newX = (left + right) / 2;
    const newY = moving.y;

    const newBlock = {
      x: newX,
      y: newY,
      w: newW,
      h: blockHeight,
      color: "#ff66cc"
    };

    // push new block on top
    tower.push(newBlock);
    // increment score
    score++;
    scoreEl.textContent = `Score: ${score}`;

    // remove moving reference and spawn next moving after small delay
    moving = null;
    setTimeout(() => {
      // next moving should inherit the new block's width
      spawnMoving();
    }, 220);
  }

  // --- Game over (lose) ---
  function gameOver() {
    cancelAnimationFrame(raf);
    gameRunning = false;
    moving = null;
    showLosePopup();
  }

  // --- Popups ---
  function showWinPopup() {
    if (winPopup) {
      winPopup.querySelector("h2").textContent = "🎉 You Win!";
      winPopup.querySelector("#win-text").textContent = "You reached the Goal Line!";
      winPopup.classList.remove("hidden");
    } else {
      alert("You Win!");
    }
  }
  function showLosePopup() {
    if (losePopup) {
      losePopup.classList.remove("hidden");
    } else {
      alert("You Lose!");
    }
  }

  // --- Controls and navigation ---
  towerCanvas.addEventListener("click", placeBlock);
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") placeBlock();
  });

  resetBtn.addEventListener("click", () => {
    // reset while staying in game screen
    cancelAll();
    resizeCanvas();
    startGame();
  });

  // menu button: stop game and return to menu
  menuBtn.addEventListener("click", () => {
    cancelAll();
    gameRunning = false;
    moving = null;
    winPopup.classList.add("hidden");
    losePopup.classList.add("hidden");
    gameScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
  });

  // win/lose popup actions
  if (winMain) winMain.addEventListener("click", () => {
    winPopup.classList.add("hidden");
    cancelAll();
    gameScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
  });
  if (winRestart) winRestart.addEventListener("click", () => {
    winPopup.classList.add("hidden");
    resizeCanvas();
    startGame();
  });

  if (loseMain) loseMain.addEventListener("click", () => {
    losePopup.classList.add("hidden");
    cancelAll();
    gameScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
  });
  if (loseRestart) loseRestart.addEventListener("click", () => {
    losePopup.classList.add("hidden");
    resizeCanvas();
    startGame();
  });

  // initialize (menu visible)
  resizeCanvas();
});
