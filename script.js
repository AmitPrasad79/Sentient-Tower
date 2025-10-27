document.addEventListener("DOMContentLoaded", () => {
  const modeBtns = document.querySelectorAll(".mode-btn");
  const startBtn = document.getElementById("start-btn");
  const menu = document.getElementById("menu");
  const game = document.getElementById("game");
  const winPopup = document.getElementById("win");
  const winMain = document.getElementById("win-main");
  const winRestart = document.getElementById("win-restart");
  const menuBtn = document.getElementById("menu-btn");
  const resetBtn = document.getElementById("reset-btn");
  const movesText = document.getElementById("moves");
  const puzzleBox = document.getElementById("puzzle");
  const previewImg = document.getElementById("preview-img");
  const winImg = document.getElementById("win-img");

  let selectedSize = null;
  let moves = 0;

  // Choose difficulty
  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      modeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedSize = parseInt(btn.getAttribute("data-size"));
      startBtn.disabled = false;
    });
  });

  // Start Game
  startBtn.addEventListener("click", () => {
    if (!selectedSize) return;

    menu.classList.add("hidden");
    game.classList.remove("hidden");
    generateTower(selectedSize);
  });

  // Reset
  resetBtn.addEventListener("click", () => {
    moves = 0;
    movesText.textContent = "Moves: 0";
    generateTower(selectedSize);
  });

  // Menu Button
  menuBtn.addEventListener("click", () => {
    game.classList.add("hidden");
    menu.classList.remove("hidden");
    startBtn.disabled = true;
    modeBtns.forEach((b) => b.classList.remove("active"));
  });

  // Win actions
  winMain.addEventListener("click", () => {
    winPopup.classList.add("hidden");
    game.classList.add("hidden");
    menu.classList.remove("hidden");
    startBtn.disabled = true;
  });

  winRestart.addEventListener("click", () => {
    winPopup.classList.add("hidden");
    generateTower(selectedSize);
  });

  function generateTower(size) {
    puzzleBox.innerHTML = "";
    moves = 0;
    movesText.textContent = "Moves: 0";

    // Simple Tower game logic (like Hanoi-style blocks)
    const totalBlocks = size * 3;
    const blocks = [];

    for (let i = totalBlocks; i > 0; i--) {
      const block = document.createElement("div");
      block.className = "tower-block";
      block.style.width = `${40 + i * 10}px`;
      block.style.background = `hsl(${i * 20}, 70%, 60%)`;
      blocks.push(block);
      puzzleBox.appendChild(block);
    }

    // Clicking logic (dummy version for now)
    blocks.forEach((block) => {
      block.addEventListener("click", () => {
        moves++;
        movesText.textContent = `Moves: ${moves}`;
        if (moves >= size * 5) showWin();
      });
    });
  }

  function showWin() {
    winImg.src = previewImg.src || "";
    winPopup.classList.remove("hidden");
  }
});
