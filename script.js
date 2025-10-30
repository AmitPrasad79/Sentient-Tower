// script.js - hardened / fixed version
document.addEventListener("DOMContentLoaded", () => {
  // DOM refs
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

  // canvas ctx
  const ctx = towerCanvas.getContext("2d");

  // state
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

  // Ensure Start is enabled by default (makes debugging easier)
  // Default active mode -> medium
  function initDefaultMode() {
    if (modeBtns && modeBtns.length) {
      modeBtns.forEach(b => b.classList.remove("active"));
      // try to find medium, else first
      let medium = Array.from(modeBtns).find(m => m.dataset.speed === "medium");
      const chosen = medium || modeBtns[0];
      chosen.classList.add("active");
      startBtn.disabled = false;
      const spd = chosen.dataset.speed;
      baseSpeed = (spd === "slow") ? 2 : (spd === "fast") ? 5 : 3.5;
    } else {
      startBtn.disabled = false;
      baseSpeed = 3;
    }
  }

  // Resize the canvas to match the visible tower-box (parent element)
  function resizeCanvas() {
    try {
      const rect = towerCanvas.parentElement.getBoundingClientRect();
      W = Math.max(100, Math.floor(rect.width));
      H = Math.max(100, Math.floor(rect.height));
      // set canvas internal resolution to match display size
      towerCanvas.width = W;
      towerCanvas.height = H;
    } catch (err) {
      console.error("resizeCanvas error:", err);
    }
  }
  window.addEventListener("resize", resizeCanvas);

  // Difficulty buttons behavior
  if (modeBtns && modeBtns.length) {
    modeBtns.forEach(btn => {
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
  }

  // Reset full logical state
  function resetGameState() {
    cancelAnimationFrame(raf);
    clearInterval(countdownTimer);
    tower = [];
    moving = null;
    score = 0;
    scoreEl && (scoreEl.textContent = "Score: 0");
    gameRunning = false;
    countdown = 3;
  }

  // Start button -> show game screen then countdown
  startBtn.addEventListener("click", (e) => {
    e && e.preventDefault && e.preventDefault();
    if (startBtn.disabled) {
      console.log("Start button disabled: pick a difficulty first.");
      return;
    }

    console.log("Start pressed — resetting state & starting countdown.");
    resetGameState();
    if (winPopup) winPopup.classList.add("hidden");
    if (losePopup) losePopup.classList.add("hidden");

    // switch screens
    if (menuScreen) {
      menuScreen.classList.add("hidden");
      menuScreen.classList.remove("active");
    }
    if (gameScreen) {
      gameScreen.classList.remove("hidden");
      gameScreen.classList.add("active");
    }

    // resize after layout change then run countdown
    setTimeout(() => {
      resizeCanvas();
      runCountdown();
    }, 80);
  });

  // Countdown drawing
  function runCountdown() {
    countdown = 3;
    clearInterval(countdownTimer);

    countdownTimer = setInterval(() => {
      // draw centered number
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

  // Initialize base block and start loop
  function initTowerAndStart() {
    try {
      cancelAnimationFrame(raf);
      tower = [];
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
    } catch (err) {
      console.error("initTowerAndStart error:", err);
    }
  }

  // spawn moving block from random side
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
    speed = baseSpeed + Math.min(4, tower.length * 0.12);
  }

  function drawBlock(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = b.color;
    ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
    ctx.restore();
  }

  function loop() {
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
    ctx.font = "12px Poppins";
    ctx.textAlign = "center";
    ctx.fillText("⭐ Goal Line", W / 2, goalHeight - 10);

    // draw stacked blocks
    for (const b of tower) drawBlock(b);

    // animate moving block
    if (moving) {
      if (gameRunning) {
        moving.x += moving.dir * speed;
        // bounce at edges so player can always click it
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

    // win check
    if (gameRunning && tower.length > 1) {
      const top = tower[tower.length - 1];
      if (top.y - top.h / 2 <= goalHeight) {
        cancelAnimationFrame(raf);
        gameRunning = false;
        moving = null;
        showWin();
        return;
      }
    }

    raf = requestAnimationFrame(loop);
  }

  // place moving block
  function placeBlock() {
    if (!gameRunning || !moving) return;

    const top = tower[tower.length - 1];
    const left = Math.max(moving.x - moving.w / 2, top.x - top.w / 2);
    const right = Math.min(moving.x + moving.w / 2, top.x + top.w / 2);
    const overlap = right - left;

    if (overlap <= 0) {
      lose();
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
    scoreEl && (scoreEl.textContent = `Score: ${score}`);
    moving = null;

    setTimeout(() => {
      if (gameRunning) spawnMoving();
    }, 220);
  }

  // win/lose popups
  function showWin() {
    if (!winPopup) return;
    winPopup.querySelector("h2").textContent = "🎉 You Win!";
    const textEl = winPopup.querySelector("#win-text");
    if (textEl) textEl.textContent = "You reached the Goal Line!";
    winPopup.classList.remove("hidden");
  }

  function lose() {
    if (losePopup) {
      losePopup.classList.remove("hidden");
    } else if (winPopup) {
      winPopup.querySelector("h2").textContent = "💀 You Lose!";
      const textEl = winPopup.querySelector("#win-text");
      if (textEl) textEl.textContent = "Your tower collapsed!";
      winPopup.classList.remove("hidden");
    }
    cancelAnimationFrame(raf);
    gameRunning = false;
    moving = null;
  }

  // Controls
  towerCanvas.addEventListener("click", placeBlock);
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") placeBlock();
  });

  // reset and menu buttons
  resetBtn && resetBtn.addEventListener("click", () => {
    resetGameState();
    if (winPopup) winPopup.classList.add("hidden");
    if (losePopup) losePopup.classList.add("hidden");
    if (menuScreen) {
      menuScreen.classList.remove("hidden");
      menuScreen.classList.add("active");
    }
    if (gameScreen) {
      gameScreen.classList.add("hidden");
      gameScreen.classList.remove("active");
    }
  });

  menuBtn && menuBtn.addEventListener("click", () => {
    resetGameState();
    if (menuScreen) {
      menuScreen.classList.remove("hidden");
      menuScreen.classList.add("active");
    }
    if (gameScreen) {
      gameScreen.classList.add("hidden");
      gameScreen.classList.remove("active");
    }
  });

  if (winMain) winMain.addEventListener("click", () => {
    resetGameState();
    winPopup.classList.add("hidden");
    if (menuScreen) {
      menuScreen.classList.remove("hidden");
      menuScreen.classList.add("active");
    }
    if (gameScreen) {
      gameScreen.classList.add("hidden");
    }
  });

  if (winRestart) winRestart.addEventListener("click", () => {
    resetGameState();
    winPopup.classList.add("hidden");
    setTimeout(() => {
      resizeCanvas();
      runCountdown();
    }, 60);
  });

  if (loseMain) loseMain.addEventListener("click", () => {
    resetGameState();
    losePopup.classList.add("hidden");
    if (menuScreen) {
      menuScreen.classList.remove("hidden");
      menuScreen.classList.add("active");
    }
  });

  if (loseRestart) loseRestart.addEventListener("click", () => {
    resetGameState();
    losePopup.classList.add("hidden");
    setTimeout(() => {
      resizeCanvas();
      runCountdown();
    }, 60);
  });

  // final init
  resizeCanvas();
  initDefaultMode();

  console.log("script.js loaded — ready.");
});
