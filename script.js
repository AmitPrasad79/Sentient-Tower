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
  const losePopup = document.getElementById("lose");
  const winMain = document.getElementById("win-main");
  const winRestart = document.getElementById("win-restart");
  const loseMain = document.getElementById("lose-main");
  const loseRestart = document.getElementById("lose-restart");

  const ctx = towerCanvas.getContext("2d");

  let W = 0,
    H = 0;
  let tower = [];
  let moving = null;
  let score = 0;
  let baseSpeed = 3.5;
  let speed = baseSpeed;
  const blockHeight = 25;
  let gameRunning = false;
  let countdown = 3;
  let raf = null;
  let countdownTimer = null;

function resizeCanvas() {
  const rect = towerCanvas.getBoundingClientRect();
  W = rect.width;
  H = rect.height;
  towerCanvas.width = W;
  towerCanvas.height = H;
}
  
  window.addEventListener("resize", resizeCanvas);

  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      modeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      startBtn.disabled = false;
      const spd = btn.dataset.speed;
      baseSpeed = spd === "slow" ? 2 : spd === "fast" ? 5 : 3.5;
    });
  });

  function resetGameState() {
    cancelAnimationFrame(raf);
    clearInterval(countdownTimer);
    tower = [];
    moving = null;
    score = 0;
    scoreEl.textContent = "Score: 0";
    gameRunning = false;
    countdown = 3;
    ctx.clearRect(0, 0, W, H);
  }

  startBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (startBtn.disabled) return;

    resetGameState();
    winPopup.classList.add("hidden");
    losePopup.classList.add("hidden");

    menuScreen.classList.add("hidden");
    menuScreen.classList.remove("active");
    gameScreen.classList.remove("hidden");
    gameScreen.classList.add("active");

    setTimeout(() => {
      resizeCanvas();
      runCountdown();
    }, 100);
  });

  function runCountdown() {
    countdown = 3;
    clearInterval(countdownTimer);

    countdownTimer = setInterval(() => {
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

  function initTowerAndStart() {
    tower = [
      {
        x: W / 2,
        y: H - blockHeight / 2,
        w: Math.max(60, Math.floor(W * 0.5)),
        h: blockHeight,
        color: "#ff66cc",
      },
    ];

    spawnMoving();
    gameRunning = true;
    loop(); 
  }

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
    speed = baseSpeed + Math.min(4, tower.length * 0.15);
  }

  // 🎨 Draw block
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

    const goalHeight = 80;
    ctx.strokeStyle = "#ffea00";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, goalHeight);
    ctx.lineTo(W, goalHeight);
    ctx.stroke();
    ctx.fillStyle = "#ffea00";
    ctx.font = "12px Poppins";
    ctx.textAlign = "center";
    ctx.fillText("⭐ Goal Line", W / 2, goalHeight - 10);

    tower.forEach(drawBlock);

    if (moving && gameRunning) {
      moving.x += moving.dir * speed;

      if (moving.x - moving.w / 2 <= 0) {
        moving.x = moving.w / 2;
        moving.dir = 1;
      } else if (moving.x + moving.w / 2 >= W) {
        moving.x = W - moving.w / 2;
        moving.dir = -1;
      }
      drawBlock(moving);
    }

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

  function placeBlock() {
    if (!gameRunning || !moving) return;
    const top = tower[tower.length - 1];
    const left = Math.max(moving.x - moving.w / 2, top.x - top.w / 2);
    const right = Math.min(moving.x + moving.w / 2, top.x + top.w / 2);
    const overlap = right - left;

    if (overlap <= 0) {
      showLose();
      return;
    }

    tower.push({
      x: (left + right) / 2,
      y: moving.y,
      w: overlap,
      h: blockHeight,
      color: "#ff66cc",
    });
    score++;
    scoreEl.textContent = `Score: ${score}`;
    moving = null;
    setTimeout(() => {
      if (gameRunning) spawnMoving();
    }, 200);
  }

  function showWin() {
    winPopup.classList.remove("hidden");
  }

  function showLose() {
    losePopup.classList.remove("hidden");
    cancelAnimationFrame(raf);
    gameRunning = false;
    moving = null;
  }

  towerCanvas.addEventListener("click", placeBlock);
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") placeBlock();
  });

  function backToMenu() {
    resetGameState();
    winPopup.classList.add("hidden");
    losePopup.classList.add("hidden");
    gameScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
  }

  resetBtn.addEventListener("click", () => {
    console.log("🔄 Reset pressed — restarting game");
    resetGameState();
    winPopup.classList.add("hidden");
    losePopup.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    menuScreen.classList.add("hidden");
    resizeCanvas();
    runCountdown();
  });

  menuBtn.addEventListener("click", backToMenu);
  winMain.addEventListener("click", backToMenu);
  loseMain.addEventListener("click", backToMenu);

  winRestart.addEventListener("click", () => {
    resetGameState();
    winPopup.classList.add("hidden");
    resizeCanvas();
    runCountdown();
  });

  loseRestart.addEventListener("click", () => {
    resetGameState();
    losePopup.classList.add("hidden");
    resizeCanvas();
    runCountdown();
  });

  resizeCanvas();
  console.log("✅ Game initialized successfully");
});
