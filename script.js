const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const loadingElement = document.getElementById('loading');

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

const heroImg = new Image();
const treasureImg = new Image();
const mimicImg = new Image();
const coinImg = new Image();

heroImg.src = './images/hero.png';
treasureImg.src = './images/treasure.png';
mimicImg.src = './images/mimic.png';
coinImg.src = './images/coin.png';

const bgm = new Audio('./audio/bgm.mp3');
bgm.loop = true;

let loadedImages = 0;
const totalImages = 4;

function imageLoadedOrFailed(name) {
  loadedImages++;
  console.log(`画像読み込み: ${name} (${loadedImages}/${totalImages})`);
  if (loadedImages === totalImages) {
    initGame();
    loadingElement.style.display = 'none';
  }
}

heroImg.onload = () => imageLoadedOrFailed("hero.png");
heroImg.onerror = () => {
  console.error("hero.png が読み込めません。");
  imageLoadedOrFailed("hero.png (失敗)");
};

treasureImg.onload = () => imageLoadedOrFailed("treasure.png");
treasureImg.onerror = () => {
  console.error("treasure.png が読み込めません。");
  imageLoadedOrFailed("treasure.png (失敗)");
};

mimicImg.onload = () => imageLoadedOrFailed("mimic.png");
mimicImg.onerror = () => {
  console.error("mimic.png が読み込めません。");
  imageLoadedOrFailed("mimic.png (失敗)");
};

coinImg.onload = () => imageLoadedOrFailed("coin.png");
coinImg.onerror = () => {
  console.error("coin.png が読み込めません。");
  imageLoadedOrFailed("coin.png (失敗)");
};

function initGame() {
  mazeSize = 10 + Math.floor(level * 1.5);
  if (mazeSize > 30) mazeSize = 30;

  cellSize = Math.floor(Math.min(360, window.innerWidth * 0.9) / mazeSize);
  canvas.width = mazeSize * cellSize;
  canvas.height = mazeSize * cellSize;

  generateMaze();
  placeTreasures();
  hero = { x: 1, y: 1 };
  gameOver = false;
  gameWon = false;
  revealedTreasures = [];
  usedMimics = [];

  draw();
  document.getElementById('level').textContent = level;
}

function generateMaze() {
  maze = Array(mazeSize).fill().map(() => Array(mazeSize).fill(1));
  const stack = [];
  const startX = 1;
  const startY = 1;
  maze[startY][startX] = 0;
  stack.push({ x: startX, y: startY });

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const directions = [];

    if (current.y >= 3 && maze[current.y - 2][current.x] === 1) directions.push({ x: 0, y: -1 });
    if (current.y <= mazeSize - 4 && maze[current.y + 2][current.x] === 1) directions.push({ x: 0, y: 1 });
    if (current.x >= 3 && maze[current.y][current.x - 2] === 1) directions.push({ x: -1, y: 0 });
    if (current.x <= mazeSize - 4 && maze[current.y][current.x + 2] === 1) directions.push({ x: 1, y: 0 });

    if (directions.length > 0) {
      const dir = directions[Math.floor(Math.random() * directions.length)];
      maze[current.y + dir.y][current.x + dir.x] = 0;
      maze[current.y + dir.y * 2][current.x + dir.x * 2] = 0;
      stack.push({ x: current.x + dir.x * 2, y: current.y + dir.y * 2 });
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
        if (ny > 0 && ny < mazeSize && nx > 0 && nx < mazeSize) {
          maze[ny][nx] = 0;
        }
      }
    }
  });

  treasures = area.map((pos, i) => ({
    x: pos.x,
    y: pos.y,
    isMimic: i !== 0
  }));

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

  treasures.forEach(t => {
    const revealed = revealedTreasures.find(rt => rt.x === t.x && rt.y === t.y);
    const img = revealed
      ? (t.isMimic ? mimicImg : coinImg)
      : treasureImg;
    ctx.drawImage(img, t.x * cellSize, t.y * cellSize, cellSize, cellSize);
  });

  ctx.drawImage(heroImg, hero.x * cellSize, hero.y * cellSize, cellSize, cellSize);
}

function moveHero(dx, dy) {
  if (gameOver || gameWon) return;
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
    if (
      hero.x === t.x &&
      hero.y === t.y &&
      !revealedTreasures.some(rt => rt.x === t.x && rt.y === t.y)
    ) {
      if (t.isMimic) {
        if (!usedMimics.some(m => m.x === t.x && m.y === t.y)) {
          usedMimics.push({ x: t.x, y: t.y });
          showQuiz(t);
        }
      } else {
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
          showMessage("おめでとう！全クリア！");
        }
      }
      break;
    }
  }
}

function showMessage(text) {
  const msg = document.getElementById('message');
  msg.textContent = text;
  msg.style.display = 'block';
}

function hideMessage() {
  document.getElementById('message').style.display = 'none';
}

// クイズ機能
const quizData = [
  { question: "カタツムリの目はどこ？", options: ["足の裏", "目立たない", "触角の先"], answer: "触角の先" },
  { question: "雷の音の原因は？", options: ["風", "空気が温まる", "雲がぶつかる"], answer: "空気が温まる" },
  { question: "氷が水に浮く理由は？", options: ["空気", "密度", "水が重い"], answer: "密度" },
  { question: "一番重い臓器は？", options: ["肝臓", "心臓", "腎臓"], answer: "肝臓" },
  { question: "タコの心臓の数は？", options: ["1つ", "2つ", "3つ"], answer: "3つ" }
];

function showQuiz(treasure) {
  const quizBox = document.getElementById("quiz-box");
  const questionEl = document.getElementById("quiz-question");
  const optionsEl = document.getElementById("quiz-options");

  const quiz = quizData[Math.floor(Math.random() * quizData.length)];
  questionEl.textContent = quiz.question;
  optionsEl.innerHTML = "";

  quiz.options.forEach(option => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.onclick = () => {
      quizBox.classList.add("hidden");
      if (option === quiz.answer) {
        maze[treasure.y][treasure.x] = 0;
        revealedTreasures.push(treasure);
        draw();
      } else {
        revealedTreasures.push(treasure);
        draw();
        gameOver = true;
        showMessage("ミミックに食べられた！ゲームオーバー！");
      }
    };
    optionsEl.appendChild(btn);
  });

  quizBox.classList.remove("hidden");
}

// 操作イベント
const buttons = {
  up: document.getElementById('up'),
  down: document.getElementById('down'),
  left: document.getElementById('left'),
  right: document.getElementById('right')
};

const states = { up: false, down: false, left: false, right: false };

function setupBtn(id, dx, dy) {
  const btn = buttons[id];
  btn.addEventListener('mousedown', () => states[id] = true);
  btn.addEventListener('mouseup', () => states[id] = false);
  btn.addEventListener('mouseleave', () => states[id] = false);
  btn.addEventListener('touchstart', e => { e.preventDefault(); states[id] = true; });
  btn.addEventListener('touchend', e => { e.preventDefault(); states[id] = false; });
}

setupBtn('up', 0, -1);
setupBtn('down', 0, 1);
setupBtn('left', -1, 0);
setupBtn('right', 1, 0);

setInterval(() => {
  if (states.up) moveHero(0, -1);
  if (states.down) moveHero(0, 1);
  if (states.left) moveHero(-1, 0);
  if (states.right) moveHero(1, 0);
}, 150);

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp') moveHero(0, -1);
  if (e.key === 'ArrowDown') moveHero(0, 1);
  if (e.key === 'ArrowLeft') moveHero(-1, 0);
  if (e.key === 'ArrowRight') moveHero(1, 0);
});
