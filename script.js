let level = 1;
let mazeSize = 10 + Math.floor(level * 1.5);
let cellSize = 45;
let maze = [];
let hero = { x: 1, y: 1 };
let treasures = [];
let gameOver = false;
let gameWon = false;
let revealedTreasures = [];
let usedMimics = [];
let isQuizActive = false;
let imagesLoaded = false;
let audioLoaded = false;

const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const loadingElement = document.getElementById('loading');

// 画像読み込み
const heroImg = new Image();
const treasureImg = new Image();
const mimicImg = new Image();
const coinImg = new Image();

// 音声設定
const bgm = document.getElementById('bgm');
const seikaiSE = document.getElementById('seikai');
const fuseikaiSE = document.getElementById('fuseikai');
const rechargeSE = document.getElementById('recharge');
const takaraSE = document.getElementById('takara');
const kamitukuSE = document.getElementById('kamituku');

// 相対パス（GitHub Pages対応）
bgm.src = './audio/bgm2.mp3';
seikaiSE.src = './audio/seikai.mp3';
fuseikaiSE.src = './audio/fuseikai.mp3';
rechargeSE.src = './audio/recharging.mp3'; // ※小文字に統一
takaraSE.src = './audio/takara.mp3';
kamitukuSE.src = './audio/kamituku.mp3';

heroImg.src = './images/hero.png';
treasureImg.src = './images/treasure.png';
mimicImg.src = './images/mimic.png';
coinImg.src = './images/coin.png';

let loadedImages = 0;
let loadedAudio = 0;
const totalImages = 4;
const totalAudio = 6;

function imageLoaded() {
  loadedImages++;
  if (loadedImages === totalImages) {
    imagesLoaded = true;
    checkAllLoaded();
  }
}

function audioLoadedFn() {
  loadedAudio++;
  if (loadedAudio === totalAudio) {
    audioLoaded = true;
    checkAllLoaded();
  }
}

function checkAllLoaded() {
  if (imagesLoaded && audioLoaded) {
    loadingElement.style.display = 'none';
    setupAudioTriggers();
    initGame();
  }
}

heroImg.onload = imageLoaded;
treasureImg.onload = imageLoaded;
mimicImg.onload = imageLoaded;
coinImg.onload = imageLoaded;

heroImg.onerror = imageLoaded;
treasureImg.onerror = imageLoaded;
mimicImg.onerror = imageLoaded;
coinImg.onerror = imageLoaded;

bgm.oncanplaythrough = audioLoadedFn;
seikaiSE.oncanplaythrough = audioLoadedFn;
fuseikaiSE.oncanplaythrough = audioLoadedFn;
rechargeSE.oncanplaythrough = audioLoadedFn;
takaraSE.oncanplaythrough = audioLoadedFn;
kamitukuSE.oncanplaythrough = audioLoadedFn;

bgm.onerror = audioLoadedFn;
seikaiSE.onerror = audioLoadedFn;
fuseikaiSE.onerror = audioLoadedFn;
rechargeSE.onerror = audioLoadedFn;
takaraSE.onerror = audioLoadedFn;
kamitukuSE.onerror = audioLoadedFn;

setTimeout(() => {
  if (!audioLoaded || !imagesLoaded) {
    console.warn("ロードタイムアウト。強制開始。");
    imagesLoaded = true;
    audioLoaded = true;
    loadingElement.style.display = 'none';
    setupAudioTriggers();
    initGame();
  }
}, 8000);

function setupAudioTriggers() {
  const startAudio = () => {
    bgm.volume = 0.5;
    bgm.play().catch(() => {});
    document.removeEventListener('click', startAudio);
    document.removeEventListener('touchstart', startAudio);
  };
  document.addEventListener('click', startAudio);
  document.addEventListener('touchstart', startAudio);
}

function initGame() {
  mazeSize = 10 + Math.floor(level * 1.5);
  if (mazeSize > 40) mazeSize = 40;
  const maxWidth = Math.min(600, window.innerWidth * 0.9);
  cellSize = Math.floor(maxWidth / mazeSize);
  canvas.width = mazeSize * cellSize;
  canvas.height = mazeSize * cellSize;

  generateMaze();
  placeTreasures();
  hero = { x: 1, y: 1 };
  gameOver = false;
  gameWon = false;
  isQuizActive = false;
  revealedTreasures = [];
  usedMimics = [];

  document.getElementById('level').textContent = level;
  draw();
}

function generateMaze() {
  maze = Array(mazeSize).fill().map(() => Array(mazeSize).fill(1));
  const stack = [];
  maze[1][1] = 0;
  stack.push({ x: 1, y: 1 });

  while (stack.length > 0) {
    const c = stack[stack.length - 1];
    const dirs = [];
    if (c.y > 2 && maze[c.y - 2][c.x] === 1) dirs.push({ x: 0, y: -1 });
    if (c.y < mazeSize - 3 && maze[c.y + 2][c.x] === 1) dirs.push({ x: 0, y: 1 });
    if (c.x > 2 && maze[c.y][c.x - 2] === 1) dirs.push({ x: -1, y: 0 });
    if (c.x < mazeSize - 3 && maze[c.y][c.x + 2] === 1) dirs.push({ x: 1, y: 0 });

    if (dirs.length > 0) {
      const dir = dirs[Math.floor(Math.random() * dirs.length)];
      maze[c.y + dir.y][c.x + dir.x] = 0;
      maze[c.y + dir.y * 2][c.x + dir.x * 2] = 0;
      stack.push({ x: c.x + dir.x * 2, y: c.y + dir.y * 2 });
    } else {
      stack.pop();
    }
  }
}

function placeTreasures() {
  const area = [
    { x: mazeSize - 2, y: mazeSize - 2 },
    { x: mazeSize - 3, y: mazeSize - 2 },
    { x: mazeSize - 2, y: mazeSize - 3 }
  ];
  area.forEach(pos => {
    maze[pos.y][pos.x] = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const ny = pos.y + dy, nx = pos.x + dx;
        if (ny > 0 && ny < mazeSize && nx > 0 && nx < mazeSize) maze[ny][nx] = 0;
      }
    }
  });
  treasures = area.map((pos, i) => ({ ...pos, isMimic: i !== 0 }));
  treasures.sort(() => Math.random() - 0.5);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < mazeSize; y++) {
    for (let x = 0; x < mazeSize; x++) {
      ctx.fillStyle = maze[y][x] === 1 ? '#333' : '#fff';
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }
  for (const t of treasures) {
    const revealed = revealedTreasures.some(rt => rt.x === t.x && rt.y === t.y);
    const img = revealed ? (t.isMimic ? mimicImg : coinImg) : treasureImg;
    ctx.drawImage(img, t.x * cellSize, t.y * cellSize, cellSize, cellSize);
  }
  ctx.drawImage(heroImg, hero.x * cellSize, hero.y * cellSize, cellSize, cellSize);
}

function moveHero(dx, dy) {
  if (gameOver || gameWon || isQuizActive) return;
  const nx = hero.x + dx, ny = hero.y + dy;
  if (maze[ny] && maze[ny][nx] === 0) {
    hero.x = nx;
    hero.y = ny;
    checkTreasures();
    draw();
  }
}

function checkTreasures() {
  for (const t of treasures) {
    if (hero.x === t.x && hero.y === t.y && !revealedTreasures.some(rt => rt.x === t.x && rt.y === t.y)) {
      if (t.isMimic) {
        if (!usedMimics.some(m => m.x === t.x && m.y === t.y)) {
          usedMimics.push({ x: t.x, y: t.y });
          isQuizActive = true;
          showMessage("ミミックだった！");
          setTimeout(() => {
            hideMessage();
            showQuiz(t);
          }, 1000);
        }
      } else {
        playSound(takaraSE);
        revealedTreasures.push(t);
        draw();
        if (level < 20) {
          level++;
          showMessage(`当たり！レベル${level}へ`);
          setTimeout(() => {
            hideMessage();
            initGame();
          }, 1500);
        } else {
          gameWon = true;
          showEnding();
        }
      }
      break;
    }
  }
}

function showEnding() {
  const screen = document.getElementById('ending-screen');
  screen.style.display = 'block';
  screen.innerHTML = `<div style="color:white;font-size:2em;text-align:center;margin-top:40%;">おめでとう！全ステージクリア！</div>`;
}

function showMessage(text) {
  const msg = document.getElementById('message');
  msg.textContent = text;
  msg.style.display = 'block';
}
function hideMessage() {
  document.getElementById('message').style.display = 'none';
}

function showQuiz(treasure) {
  const box = document.getElementById("quiz-box");
  const q = document.getElementById("quiz-question");
  const opts = document.getElementById("quiz-options");

  const quiz = quizData[Math.floor(Math.random() * quizData.length)];
  q.textContent = quiz.question;
  opts.innerHTML = "";

  quiz.options.forEach(option => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.onclick = () => {
      box.classList.add("hidden");
      box.innerHTML = "";
      revealedTreasures.push(treasure);
      if (option === quiz.answer) {
        playSound(seikaiSE);
        maze[treasure.y][treasure.x] = 0;
        draw();
      } else {
        playSound(kamitukuSE);
        draw();
        gameOver = true;
        showMessage("ミミックに食べられた！ゲームオーバー！");
      }
      isQuizActive = false;
    };
    opts.appendChild(btn);
  });
  box.classList.remove("hidden");
}

function playSound(sound) {
  if (!sound) return;
  sound.currentTime = 0;
  sound.play().catch(err => console.warn("音声再生失敗:", err));
}

const states = { up: false, down: false, left: false, right: false };

function setupControls() {
  ["up", "down", "left", "right"].forEach(dir => {
    const btn = document.getElementById(dir);
    if (!btn) return;
    btn.addEventListener("mousedown", () => states[dir] = true);
    btn.addEventListener("mouseup", () => states[dir] = false);
    btn.addEventListener("mouseleave", () => states[dir] = false);
    btn.addEventListener("touchstart", e => { e.preventDefault(); states[dir] = true; });
    btn.addEventListener("touchend", e => { e.preventDefault(); states[dir] = false; });
    btn.addEventListener("touchcancel", e => { e.preventDefault(); states[dir] = false; });
  });
}

function setupKeyboard() {
  document.addEventListener("keydown", e => {
    if (e.key === "ArrowUp") moveHero(0, -1);
    if (e.key === "ArrowDown") moveHero(0, 1);
    if (e.key === "ArrowLeft") moveHero(-1, 0);
    if (e.key === "ArrowRight") moveHero(1, 0);
  });
}

function startMovementLoop() {
  setInterval(() => {
    if (states.up) moveHero(0, -1);
    if (states.down) moveHero(0, 1);
    if (states.left) moveHero(-1, 0);
    if (states.right) moveHero(1, 0);
  }, 150);
}

function setupResizeHandler() {
  window.addEventListener('resize', () => {
    if (maze.length > 0) {
      const maxWidth = Math.min(600, window.innerWidth * 0.9);
      cellSize = Math.floor(maxWidth / mazeSize);
      canvas.width = mazeSize * cellSize;
      canvas.height = mazeSize * cellSize;
      draw();
    }
  });
}

setupControls();
setupKeyboard();
startMovementLoop();
setupResizeHandler();
