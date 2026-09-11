const MAX_OBSTACLE_ATTEMPTS = 50;
let solvedPursuit = null;
const GRID_SIZE = 10;
const GRASS_COUNT = 10;
const OBSTACLE_COUNT = 8;
const MIN_START_DISTANCE = 4;
const MOVE_LIMIT = 20;

const state = {
  sheep: { row: 0, col: 0 },
  wolf: { row: 0, col: 0 },
  grass: [],
  obstacles: [],
  score: 0,
  turn: 'sheep',
  gameOver: false,
  endReason: null,   // 'captured' | 'outOfMoves' | 'won'
  started: false,
  movesRemaining: MOVE_LIMIT,
  quizOpen: false,
  difficulty: 'easy',
  hintsUsed: 0
};

function renderGrid() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.row = row;
      cell.dataset.col = col;
      grid.appendChild(cell);
    }
  }
}

function getCell(row, col) {
  return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
}

function isOccupied(row, col) {
  return (state.sheep.row === row && state.sheep.col === col) ||
         (state.wolf.row === row && state.wolf.col === col) ||
         state.obstacles.some(o => o.row === row && o.col === col);
}

function placeObstacles() {
  state.obstacles = [];
  while (state.obstacles.length < OBSTACLE_COUNT) {
    const row = Math.floor(Math.random() * GRID_SIZE);
    const col = Math.floor(Math.random() * GRID_SIZE);
    if (isOccupied(row, col)) continue;
    state.obstacles.push({ row, col });
  }
}

function placeSheepAndWolf() {
  const isObstacle = (r, c) => state.obstacles.some(o => o.row === r && o.col === c);

  let sheepPos;
  do {
    sheepPos = { row: Math.floor(Math.random() * GRID_SIZE), col: Math.floor(Math.random() * GRID_SIZE) };
  } while (isObstacle(sheepPos.row, sheepPos.col));

  state.sheep.row = sheepPos.row;
  state.sheep.col = sheepPos.col;

  let wolfPos;
  let attempts = 0;
  do {
    wolfPos = { row: Math.floor(Math.random() * GRID_SIZE), col: Math.floor(Math.random() * GRID_SIZE) };
    attempts++;
  } while (
    attempts < 1000 &&
    (isObstacle(wolfPos.row, wolfPos.col) || manhattanDistance(wolfPos, sheepPos) < MIN_START_DISTANCE)
  );

  state.wolf.row = wolfPos.row;
  state.wolf.col = wolfPos.col;
}

function placeGrass() {
  state.grass = [];
  while (state.grass.length < GRASS_COUNT) {
    const row = Math.floor(Math.random() * GRID_SIZE);
    const col = Math.floor(Math.random() * GRID_SIZE);
    if (isOccupied(row, col)) continue;
    if (state.grass.some(g => g.row === row && g.col === col)) continue;
    state.grass.push({ row, col });
  }
}
function setupObstaclesAndSolve() {
  for (let attempt = 0; attempt < MAX_OBSTACLE_ATTEMPTS; attempt++) {
    placeObstacles();
    const result = solveOptimalPursuit(GRID_SIZE, state.obstacles);
    if (result.fullySolved) {
      solvedPursuit = result;
      return;
    }
  }
  console.warn('Could not find a fully solvable obstacle layout after', MAX_OBSTACLE_ATTEMPTS, 'attempts.');
  solvedPursuit = null;
}
function renderTokens() {
  document.querySelectorAll('.cell').forEach(cell => cell.textContent = '');
  for (const o of state.obstacles) {
    getCell(o.row, o.col).textContent = '🌳';
  }
  for (const g of state.grass) {
    getCell(g.row, g.col).textContent = '🌱';
  }
  getCell(state.sheep.row, state.sheep.col).textContent = '🐑';
  getCell(state.wolf.row, state.wolf.col).textContent = '🐺';
}

function renderTurnIndicator() {
  const indicator = document.getElementById('turn-indicator');
  if (state.gameOver) {
    if (state.endReason === 'won') {
      indicator.textContent = `🎉 You win! All grass eaten. Final score: ${state.score}/${GRASS_COUNT}`;
    } else if (state.endReason === 'captured') {
      indicator.textContent = `Game over — captured! Final score: ${state.score}/${GRASS_COUNT}`;
    } else if (state.endReason === 'outOfMoves') {
      indicator.textContent = `Out of moves. Final score: ${state.score}/${GRASS_COUNT}`;
    }  else if (state.endReason === 'quizFailed') {
      indicator.textContent = `Wrong answer — game over! Final score: ${state.score}/${GRASS_COUNT}`;
    }
  } else {
    indicator.textContent = `🌱 ${state.score}/${GRASS_COUNT} — 🐾 ${state.movesRemaining} moves left — Turn: ${state.turn === 'sheep' ? '🐑 Sheep (you)' : '🐺 Wolf'}`;
  }
}


function endGame(reason) {
  state.gameOver = true;
  state.endReason = reason;
  renderTurnIndicator();
}

function moveSheep(deltaRow, deltaCol) {
  if (!state.started || state.gameOver || state.turn !== 'sheep' || state.quizOpen) return;

  const newRow = state.sheep.row + deltaRow;
  const newCol = state.sheep.col + deltaCol;

  if (newRow < 0 || newRow >= GRID_SIZE || newCol < 0 || newCol >= GRID_SIZE) {
    return;
  }

  if (state.obstacles.some(o => o.row === newRow && o.col === newCol)) {
    return; // blocked by obstacle
  }

  state.sheep.row = newRow;
  state.sheep.col = newCol;
  state.movesRemaining--;

  // Capture check: sheep stepped onto the wolf
  if (state.sheep.row === state.wolf.row && state.sheep.col === state.wolf.col) {
    renderTokens();
    endGame('captured');
    return;
  }

  // Grass check: sheep stepped onto grass
  const grassIndex = state.grass.findIndex(g => g.row === newRow && g.col === newCol);
  if (grassIndex !== -1) {
    state.grass.splice(grassIndex, 1);
    state.score++;
    if (state.score === GRASS_COUNT) {
      renderTokens();
      renderTurnIndicator();
      endGame('won');
      return;
    }
  }

  if (state.movesRemaining <= 0) {
    renderTokens();
    endGame('outOfMoves');
    return;
  }

  state.turn = 'wolf';
  renderTokens();
  renderTurnIndicator();

  setTimeout(() => {
  if (state.gameOver) return;
  const difficulty = document.getElementById('difficulty').value;
  let wolfMove;
  if (difficulty === 'hard' && solvedPursuit) {
    wolfMove = computeWolfMoveOptimal(GRID_SIZE, state.wolf, state.sheep, state.obstacles, solvedPursuit);
  } else if (difficulty === 'medium') {
    wolfMove = computeWolfMoveMinimax(GRID_SIZE, state.wolf, state.sheep, state.obstacles, 5);
  } else if (difficulty === 'hard' && !solvedPursuit) {
    wolfMove = computeWolfMoveMinimax(GRID_SIZE, state.wolf, state.sheep, state.obstacles, 5); // fallback
  } else {
    wolfMove = computeWolfMove(GRID_SIZE, state.wolf, state.sheep, state.obstacles);
  }
  if (wolfMove) {
    state.wolf.row = wolfMove.row;
    state.wolf.col = wolfMove.col;

    // Capture check: wolf stepped onto the sheep
    if (state.wolf.row === state.sheep.row && state.wolf.col === state.sheep.col) {
    renderTokens();
    endGame('captured');
    return;
    }
}

state.turn = 'sheep';
renderTokens();
renderTurnIndicator();
}, 300);

}



document.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
  }
  switch (e.key) {
    case 'ArrowUp': moveSheep(-1, 0); break;
    case 'ArrowDown': moveSheep(1, 0); break;
    case 'ArrowLeft': moveSheep(0, -1); break;
    case 'ArrowRight': moveSheep(0, 1); break;
  }
});

function startGame() {
  state.started = true;
  state.gameOver = false;
  state.endReason = null;
  state.score = 0;
  state.movesRemaining = MOVE_LIMIT;
  state.quizOpen = false;
  usedQuestionIndices = [];
  state.difficulty = document.getElementById('difficulty').value;
  state.hintsUsed = 0;

  renderGrid();
  setupObstaclesAndSolve();
  placeSheepAndWolf();
  placeGrass();
  renderTokens();
  renderTurnIndicator();
  updateHintButton();
}

document.getElementById('play-button').addEventListener('click', () => {
  document.getElementById('landing-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  startGame();
});
document.getElementById('hint-button').addEventListener('click', openHintModal);