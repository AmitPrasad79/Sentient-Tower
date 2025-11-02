const bgCanvas = document.getElementById("bgCanvas");
const ctx = bgCanvas.getContext("2d");

// ✅ Setup Canvas Style
bgCanvas.style.position = "fixed";
bgCanvas.style.top = "0";
bgCanvas.style.left = "0";
bgCanvas.style.width = "100%";
bgCanvas.style.height = "100%";
bgCanvas.style.zIndex = "0"; // slightly behind content
bgCanvas.style.pointerEvents = "none";
bgCanvas.style.filter = "blur(0.5px) brightness(1.1)";

// ✅ Resize canvas with window
function resizeBg() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeBg);
resizeBg();

// ✅ Update image path for GamesHub
const img = new Image();
img.src = "./assets/sentient.png"; // path fixed

let balls = [];
let imageLoaded = false;

// Wait for image to load before starting animation
img.onload = () => {
  imageLoaded = true;
  console.log("✅ Sentient image loaded for GamesHub background");
};

// ✅ Ball generator
function createBall() {
  balls.push({
    x: Math.random() * bgCanvas.width,
    y: -50,
    size: Math.random() * 40 + 25,
    speed: Math.random() * 1.4 + 0.5,
    rotation: Math.random() * 360,
    rotationSpeed: Math.random() * 0.7 - 0.3,
    glow: Math.random() * 6 + 4
  });
}

setInterval(() => {
  if (balls.length < 8) createBall();
}, 800);

// ✅ Draw single ball with glow effect
function drawBall(b) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate((b.rotation * Math.PI) / 180);
  ctx.globalAlpha = 0.8;
  ctx.shadowBlur = b.glow;
  ctx.shadowColor = "#ff9f43";
  ctx.drawImage(img, -b.size / 2, -b.size / 2, b.size, b.size);
  ctx.restore();
}

// ✅ Main animation loop
function update() {
  ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

  if (imageLoaded) {
    for (let b of balls) {
      b.y += b.speed;
      b.rotation += b.rotationSpeed;
      drawBall(b);
    }
    balls = balls.filter(b => b.y < bgCanvas.height + 50);
  }

  requestAnimationFrame(update);
}

update();
