// script.js -- full replacement
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
  let dpr = Math.max(1, window.devicePixelRatio || 1);

  let tower = [];
  let moving = null;
  let score = 0;
  let baseSpeed = 2;
  let speed = baseSpeed;
  const blockHeight = 25;
  let gameRunning = false;
  let countdown = 3;
  let raf = null;

  // ---- Canvas resize (handles DPR) ----
  function resizeCanvas() {
    const rect = towerCanvas.parentElement.getBoundingClientRect();
    W = Math.max(100, Math.floor(rect.width));
    H = Math.max(100, Math.floor(rect.height));
    dpr = Math.max(1, window.devicePixelRatio || 1);

    towerCanvas.style.width = W + "px";
    towerCanvas.style.height = H + "px";

    towerCanvas.width = Math.round(W * dpr);
    towerCanvas.height = Math.round(H * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", () => {
    resizeCanvas();
    // if game running, redraw once
    if (gameRunning === false) drawStatic();
  });
  resizeCanvas();

  // ---- UI: difficulty buttons enable Start ----
  startBtn.disabled = true;
  modeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      modeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      startBtn.disabled = false;
      // set base speed by mode
      if (btn.dataset.speed === "slow") baseSpeed = 2;
      else if (btn.dataset.speed === "medium") baseSpeed = 3.5;
      else if (btn.dataset.speed === "fast") baseSpeed = 5;
      // update current speed
      speed = baseSpeed;
    });
  });

  // ---- Menu <-> Game visibility helpers ----
  function showMenu() {
    cancelAnimationFrame(raf);
    gameRunning = false;
    moving = null;
    // use classes if CSS handles it, ensure correct displays
    menuScreen.classList.remove("hidden");
    menuScreen.classList.add("active");
    gameScreen.classList.remove("active");
    gameScreen.classList.add("hidden");
  }
  function showGame() {
    menuScreen.classList.add("hidden");
    menuScreen.classList.remove("active");
    gameScreen.classList.remove("hidden");
    gameScreen.classList.add("active");
  }

  // ---- Start button ----
  startBtn.addEventListener("click", (e) => {
    e.preventDefault();
    showGame();
    startGame();
  });

  // ---- Start / Reset game ----
  function startGame() {
    cancelAnimationFrame(raf);
    score = 0;
    tower = [];
    moving = null;
    gameRunning = false;
    countdown = 3;
    scoreEl.textContent = "Score: 0";
    winPopup.classList.add("hidden");
    resizeCanvas();
    runCountdown();
  }

  // ---- simple static draw while idle ----
  function drawStatic() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    // goal line visible even when idle
    const goalHeight = Math.max(40, Math.round(H * 0.12));
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
  }

  // ---- Countdown ----
  function runCountdown() {
    // show countdown on the tower area
    const timer = setInterval(() => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#ff66cc";
      // ensure font size reasonably sized
      ctx.font = `${Math.max(24, Math.floor(H / 4))}px Poppins`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(countdown > 0 ? countdown : "GO!", W / 2, H / 2);

      if (countdown < 0) {
        clearInterval(timer);
        initTower();
        gameRunning = true;
        // start loop
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      }
      countdown--;
    }, 1000);
  }

  // ---- Tower init ----
  function initTower() {
    // base block at bottom center
    const base = {
      x: W / 2,
      y: H - blockHeight / 2 - 8, // small padding from bottom
      w: Math.max(40, W * 0.6),
      h: blockHeight,
      color: "#ff66cc"
    };
    tower = [ base ];
    speed = baseSpeed;
    spawnMoving();
  }

  // ---- Spawn moving block (from left or right) ----
  function spawnMoving() {
    const last = tower[tower.length - 1];
    if (!last) return;
    const fromLeft = Math.random() < 0.5;
    // start just outside the canvas so it "slides in"
    const startX = fromLeft ? -last.w / 2 : W + last.w / 2;
    moving = {
      x: startX,
      y: last.y - blockHeight - 4,
      w: last.w,
      h: blockHeight,
      dir: fromLeft ? 1 : -1,
      color: "#ff66cc"
    };
    // update speed a little as stack grows (not too fast)
    speed = Math.min(7, baseSpeed + tower.length * 0.08);
  }

  // ---- Draw block ----
  function drawBlock(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = b.color;
    // draw with integer coordinates to avoid blurry sub-pixel artifacts
    const x = Math.round(-b.w / 2);
    const y = Math.round(-b.h / 2);
    const w = Math.round(b.w);
    const h = Math.round(b.h);
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  // ---- Main loop ----
  function loop() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    // goal line
    const goalHeight = Math.max(40, Math.round(H * 0.12));
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

    // draw existing tower
    for (const b of tower) drawBlock(b);

    // animate moving block
    if (moving && gameRunning) {
      moving.x += moving.dir * speed;
      // bounce when fully hits the inner edges
      const leftEdge = moving.w / 2;
      const rightEdge = W - moving.w / 2;
      if (moving.x <= leftEdge) {
        moving.x = leftEdge;
        moving.dir = 1;
      } else if (moving.x >= rightEdge) {
        moving.x = rightEdge;
        moving.dir = -1;
      }
    }

    if (moving) drawBlock(moving);

    // check win: top block crosses goal line
    if (tower.length > 0 && gameRunning) {
      const topBlock = tower[tower.length - 1];
      if ((topBlock.y - topBlock.h / 2) <= goalHeight) {
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

  // ---- Place moving block when user taps/clicks or presses space ----
  function placeBlock() {
    if (!gameRunning || !moving) return;

    const top = tower[tower.length - 1];
    const left = Math.max(moving.x - moving.w / 2, top.x - top.w / 2);
    const right = Math.min(moving.x + moving.w / 2, top.x + top.w / 2);
    const overlap = right - left;

    if (overlap <= 0) {
      // collapsed -> lose
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

    // push new block TO THE TOWER
    tower.push(newBlock);
    score++;
    scoreEl.textContent = `Score: ${score}`;

    // move entire tower UP so the newest block is visible at bottom area
    // shift every block up by blockHeight + gap
    const shift = blockHeight + 4;
    for (let i = 0; i < tower.length; i++) {
      tower[i].y -= shift; // subtract because HTML canvas y=0 is top; we want tower to rise upward
    }

    // after shifting, ensure blocks that go above the top are still considered for win check
    moving = null;
    setTimeout(spawnMoving, 240);
  }

  // ---- Win / Lose popup helpers ----
  function showWinPopup() {
    winPopup.querySelector("h2").textContent = "🎉 You Win!";
    const textEl = winPopup.querySelector("#win-text");
    if (textEl) textEl.textContent = "You reached the Goal Line!";
    winPopup.classList.remove("hidden");
  }
  function showLosePopup() {
    winPopup.querySelector("h2").textContent = "💀 You Lose!";
    const textEl = winPopup.querySelector("#win-text");
    if (textEl) textEl.textContent = "Your tower collapsed!";
    winPopup.classList.remove("hidden");
  }

  function gameOver() {
    cancelAnimationFrame(raf);
    gameRunning = false;
    moving = null;
    showLosePopup();
  }

  // ---- Controls and events ----
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

  menuBtn.addEventListener("click", () => {
    // stop animation and go to menu
    cancelAnimationFrame(raf);
    gameRunning = false;
    moving = null;
    winPopup.classList.add("hidden");
    // hide game, show menu
    gameScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
    // draw menu view (static)
    drawStatic();
  });

  winMain.addEventListener("click", () => {
    winPopup.classList.add("hidden");
    gameScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
    drawStatic();
  });
  winRestart.addEventListener("click", () => {
    winPopup.classList.add("hidden");
    startGame();
  });

  // draw an initial static scene
  drawStatic();
});
