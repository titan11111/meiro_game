let imagesLoaded = false;
let audioLoaded = false;
const loadingElement = document.getElementById("loading");

const bgm = document.getElementById("bgm");
const seikaiSE = document.getElementById("seikai");
const fuseikaiSE = document.getElementById("fuseikai");
const rechargeSE = document.getElementById("recharge");
const takaraSE = document.getElementById("takara");
const kamitukuSE = document.getElementById("kamituku");

const heroImg = new Image();
const treasureImg = new Image();
const mimicImg = new Image();
const coinImg = new Image();

bgm.src = './sounds/bgm2.mp3';
seikaiSE.src = './sounds/seikai.mp3';
fuseikaiSE.src = './sounds/fuseikai.mp3';
rechargeSE.src = './sounds/recharging.mp3';
takaraSE.src = './sounds/takara.mp3';
kamitukuSE.src = './sounds/kamituku.mp3';

heroImg.src = './images/hero.png';
treasureImg.src = './images/treasure.png';
mimicImg.src = './images/mimic.png';
coinImg.src = './images/coin.png';

let imageCount = 0;
let audioCount = 0;

function checkAllLoaded() {
  if (imagesLoaded && audioLoaded) {
    loadingElement.style.display = 'none';
    setupAudioTriggers();
  }
}

function imageLoaded() {
  imageCount++;
  if (imageCount === 4) {
    imagesLoaded = true;
    checkAllLoaded();
  }
}

function audioLoadedFn() {
  audioCount++;
  if (audioCount === 6) {
    audioLoaded = true;
    checkAllLoaded();
  }
}

heroImg.onload = treasureImg.onload = mimicImg.onload = coinImg.onload = imageLoaded;
bgm.oncanplaythrough = seikaiSE.oncanplaythrough = fuseikaiSE.oncanplaythrough =
rechargeSE.oncanplaythrough = takaraSE.oncanplaythrough = kamitukuSE.oncanplaythrough = audioLoadedFn;

setTimeout(() => {
  if (!imagesLoaded || !audioLoaded) {
    console.warn("読み込み遅延 → 強制開始");
    imagesLoaded = true;
    audioLoaded = true;
    loadingElement.style.display = 'none';
    setupAudioTriggers();
  }
}, 8000);

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('start-button').addEventListener('click', () => {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-container').classList.remove('hidden');
    playSound(bgm);
    setupGame();
  });

  document.getElementById('restart-button').addEventListener('click', () => {
    document.getElementById('restart-screen').classList.add('hidden');
    document.getElementById('game-container').classList.remove('hidden');
    level = 1;
    playSound(bgm);
    setupGame();
  });
});

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

// === ゲーム本体 ===

let level = 1;
let mazeSize;
let cellSize;
let maze = [];
let hero = { x: 1, y: 1 };
let treasures = [];
let revealedTreasures = [];
let usedMimics = [];
let gameOver = false;
let gameWon = false;
let isQuizActive = false;

const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');

function setupGame() {
  setupControls();
  setupKeyboard();
  setupResizeHandler();
  initGame();
}

function initGame() {
  mazeSize = 10 + Math.floor(level * 1.5);
  if (mazeSize > 40) mazeSize = 40;
  const maxWidth = Math.min(window.innerWidth * 0.95, window.innerHeight * 0.75, 600);
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
  const shuffled = area.sort(() => Math.random() - 0.5);
  treasures = shuffled.map((pos, i) => ({ ...pos, isMimic: i !== 0 }));
  for (const pos of area) {
    maze[pos.y][pos.x] = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const ny = pos.y + dy, nx = pos.x + dx;
        if (ny > 0 && ny < mazeSize && nx > 0 && nx < mazeSize) maze[ny][nx] = 0;
      }
    }
  }
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
        setTimeout(() => {
          document.getElementById('game-container').classList.add('hidden');
          document.getElementById('restart-screen').classList.remove('hidden');
        }, 2000);
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
  sound.play().catch(() => {});
}

function setupControls() {
  ["up", "down", "left", "right"].forEach(dir => {
    const btn = document.getElementById(dir);
    if (!btn) return;
    btn.addEventListener("mousedown", () => move(dir));
    btn.addEventListener("touchstart", e => {
      e.preventDefault();
      move(dir);
    });
  });
}

function move(dir) {
  if (dir === "up") moveHero(0, -1);
  if (dir === "down") moveHero(0, 1);
  if (dir === "left") moveHero(-1, 0);
  if (dir === "right") moveHero(1, 0);
}

function setupKeyboard() {
  document.addEventListener("keydown", e => {
    if (e.key === "ArrowUp") moveHero(0, -1);
    if (e.key === "ArrowDown") moveHero(0, 1);
    if (e.key === "ArrowLeft") moveHero(-1, 0);
    if (e.key === "ArrowRight") moveHero(1, 0);
  });
}

function setupResizeHandler() {
  window.addEventListener('resize', () => {
    if (maze.length > 0) {
      const maxWidth = Math.min(window.innerWidth * 0.95, window.innerHeight * 0.75, 600);
      cellSize = Math.floor(maxWidth / mazeSize);
      canvas.width = mazeSize * cellSize;
      canvas.height = mazeSize * cellSize;
      draw();
    }
  });
}
