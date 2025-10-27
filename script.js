// Sentient Tower Game
document.addEventListener("DOMContentLoaded", () => {
  const menuScreen = document.getElementById("menu");
  const gameScreen = document.getElementById("game");
  const startBtn = document.getElementById("start-btn");
  const modeBtns = document.querySelectorAll(".mode-btn");
  const resetBtn = document.getElementById("reset-btn");
  const menuBtn = document.getElementById("menu-btn");
  const scoreDisplay = document.getElementById("score");
  const winPopup = document.getElementById("win");
  const winMain = document.getElementById("win-main");
  const winRestart = document.getElementById("win-restart");

  const canvas = document.getElementById("towerCanvas");
  const ctx = canvas.getContext("2d");

  let currentMode = null;
  let gameActive = false;
  let blocks = [];
  let currentBlock = null;
  let score = 0;
  let speed = 2;
  let direction = 1;
  let animationFrame;

  // ✅ Handle mode selection
  modeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      modeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentMode = btn.dataset.speed;

      // enable Start button
      startBtn.disabled = false;
      startBtn.classList.add("primary");
    });
  });

  // ✅ Handle Start Game
  startBtn.addEventListener("click", () => {
    if (!currentMode) return;
    menuScreen.classList.remove("active");
    menuScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    startGame();
  });

  // ✅ Handle Reset
  resetBtn.addEventListener("click", () => startGame());

  // ✅ Handle Menu
  menuBtn.addEventListener("click", () => {
    cancelAnimationFrame(animationFrame);
    gameScreen.classList.add("hidden");
    menuScreen.classList.add("active");
    startBtn.disabled = true;
    startBtn.classList.remove("primary");
    score = 0;
    scoreDisplay.textContent = "Score: 0";
  });

  // ✅ Handle Win Popup buttons
  winMain.addEventListener("click", () => {
    winPopup.classList.add("hidden");
    menuScreen.classList.add("active");
  });
  winRestart.addEventListener("click", () => {
    winPopup.classList.add("hidden");
    startGame();
  });

  // 🧱 Start / Reset Game
  function startGame() {
    cancelAnimationFrame(animationFrame);
    resizeCanvas();

    // mode speed setup
    if (currentMode === "slow") speed = 2;
    else if (currentMode === "medium") speed = 3.5;
    else if (currentMode === "fast") speed = 5;

    blocks = [];
    score = 0;
    direction = 1;
    scoreDisplay.textContent = "Score: 0";
    gameActive = true;

    // create first block (base)
    const baseHeight = 30;
    const baseWidth = canvas.width * 0.6;
    const baseY = canvas.height - baseHeight;
    blocks.push({
      x: (canvas.width - baseWidth) / 2,
      y: baseY,
      width: baseWidth,
      height: baseHeight,
      color: "#ff66cc"
    });

    // first falling block
    addNewBlock();
    animate();
  }

  // 🧩 Resize canvas to container
  function resizeCanvas() {
    const box = document.getElementById("tower-box");
    canvas.width = box.offsetWidth;
    canvas.height = box.offsetHeight;
  }

  // 🧱 Add new moving block
  function addNewBlock() {
    const last = blocks[blocks.length - 1];
    const newWidth = last ? last.width : canvas.width * 0.6;
    const blockHeight = 30;

    blocks.push({
      x: 0,
      y: last ? last.y - blockHeight : canvas.height - blockHeight,
      width: newWidth,
      height: blockHeight,
      color: "#ff66cc"
    });

    currentBlock = blocks[blocks.length - 1];
    direction = 1;
  }

  // 🖱️ Player action (click/space/arrow)
  document.addEventListener("keydown", e => {
    if (e.code === "Space" || e.code === "ArrowUp") placeBlock();
  });
  canvas.addEventListener("click", placeBlock);

  // 🧩 Place current block
  function placeBlock() {
    if (!gameActive || !currentBlock) return;
    const last = blocks[blocks.length - 2];
    if (!last) return;

    const diff = currentBlock.x - last.x;
    const overlap = last.width - Math.abs(diff);

    if (overlap > 5) {
      const newWidth = overlap;
      currentBlock.width = newWidth;
      if (diff > 0) currentBlock.x = last.x + (last.width - newWidth);
      else currentBlock.x = last.x;
      score++;
      scoreDisplay.textContent = `Score: ${score}`;
      addNewBlock();
    } else {
      gameOver();
    }
  }

  // 🧱 Draw everything
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    blocks.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.width, b.height);
    });
  }

  // 🎬 Animate falling block
  function animate() {
    if (!gameActive) return;
    const moving = blocks[blocks.length - 1];
    const last = blocks[blocks.length - 2];
    if (moving && last) {
      moving.x += speed * direction;
      if (moving.x + moving.width > canvas.width || moving.x < 0)
        direction *= -1;
    }

    draw();
    animationFrame = requestAnimationFrame(animate);
  }

  // ❌ Game Over
  function gameOver() {
    gameActive = false;
    cancelAnimationFrame(animationFrame);
    winPopup.classList.remove("hidden");
    document.getElementById("win-text").textContent = `Final Score: ${score}`;
  }

  window.addEventListener("resize", resizeCanvas);
});
