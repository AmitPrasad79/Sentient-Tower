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

  // ✅ Difficulty buttons
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

  // ✅ Start Game
  startBtn.addEventListener("click", (e) => {
    e.preventDefault();
    // Hide menu and show game screen
    menuScreen.classList.add("hidden");
    menuScreen.classList.remove("active");
    gameScreen.classList.remove("hidden");
    gameScreen.classList.add("active");
    startGame();
  });

  // ✅ Game Setup
  function startGame() {
    cancelAnimationFrame(raf);
    score = 0;
    tower = [];
    moving = null;
    gameRunning = false;
    countdown = 3;
    scoreEl.textContent = "Score: 0";
    winPopup.classList.add("hidden");

    // Wait for screen to become visible before resizing
    setTimeout(() => {
      resizeCanvas(); // re-measure visible game area
      runCountdown();
    }, 50);
  }


  // ✅ Countdown
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

  // ✅ Create base block
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

  // ✅ Spawn moving block
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
    speed = Math.min(6, 2 + tower.length * 0.1);
  }

  // ✅ Draw block
  function drawBlock(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = b.color;
    ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
    ctx.restore();
  }

  // ✅ Game loop
  function loop() {
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

    for (const b of tower) drawBlock(b);

    if (moving && gameRunning) {
      moving.x += moving.dir * speed;
      if (moving.x - moving.w / 2 <= 0 || moving.x + moving.w / 2 >= W) {
        moving.dir *= -1;
      }
    }

    if (moving) drawBlock(moving);

    if (tower.length > 1 && gameRunning) {
      const topBlock = tower[tower.length - 1];
      if (topBlock.y - topBlock.h / 2 <= goalHeight) {
        cancelAnimationFrame(raf);
        gameRunning = false;
        moving = null;
        showWinPopup();
        return;
      }
    }

    raf = requestAnimationFrame(loop);
  }

  function showWinPopup() {
    winPopup.querySelector("h2").textContent = "🎉 You Win!";
    winPopup.querySelector("#win-text").textContent = "You reached the Goal Line!";
    winPopup.classList.remove("hidden");
  }

  function showLosePopup() {
    winPopup.querySelector("h2").textContent = "💀 You Lose!";
    winPopup.querySelector("#win-text").textContent = "Your tower collapsed!";
    winPopup.classList.remove("hidden");
  }

  function gameOver() {
    cancelAnimationFrame(raf);
    gameRunning = false;
    moving = null;
    showLosePopup();
  }

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
      color: "#ff66cc",
    };

    tower.push(newBlock);
    score++;
    scoreEl.textContent = `Score: ${score}`;
    moving = null;
    setTimeout(spawnMoving, 300);
  }

  // ✅ Controls
  towerCanvas.addEventListener("click", placeBlock);
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") placeBlock();
  });
  resetBtn.addEventListener("click", startGame);
  menuBtn.addEventListener("click", () => {
    gameScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
    cancelAnimationFrame(raf);
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
