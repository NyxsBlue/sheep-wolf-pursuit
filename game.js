const GRID_SIZE = 10;
const GRASS_COUNT = 6;

const state = {
  sheep: { row: Math.floor(GRID_SIZE / 2), col: Math.floor(GRID_SIZE / 2) },
  wolf: { row: 0, col: 0 },
  grass: [],            // array of {row, col}
  score: 0,
  turn: 'sheep',
  gameOver: false,
  won: false
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
         (state.wolf.row === row && state.wolf.col === col);
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

function renderTokens() {
  document.querySelectorAll('.cell').forEach(cell => cell.textContent = '');

  for (const g of state.grass) {
    getCell(g.row, g.col).textContent = '🌱';
  }
  getCell(state.sheep.row, state.sheep.col).textContent = '🐑';
  getCell(state.wolf.row, state.wolf.col).textContent = '🐺';
}

function renderTurnIndicator() {
  const indicator = document.getElementById('turn-indicator');
  if (state.gameOver) {
    indicator.textContent = state.won ? '🎉 You win! All grass eaten.' : 'Game over — captured!';
  } else {
    indicator.textContent = `🌱 ${state.score}/${GRASS_COUNT} — Turn: ${state.turn === 'sheep' ? '🐑 Sheep (you)' : '🐺 Wolf'}`;
  }
}

function endGame(won) {
  state.gameOver = true;
  state.won = won;
  renderTurnIndicator();
}

function moveSheep(deltaRow, deltaCol) {
  if (state.gameOver || state.turn !== 'sheep') return;

  const newRow = state.sheep.row + deltaRow;
  const newCol = state.sheep.col + deltaCol;

  if (newRow < 0 || newRow >= GRID_SIZE || newCol < 0 || newCol >= GRID_SIZE) {
    return;
  }

  state.sheep.row = newRow;
  state.sheep.col = newCol;

  // Capture check: sheep stepped onto the wolf
  if (state.sheep.row === state.wolf.row && state.sheep.col === state.wolf.col) {
    renderTokens();
    endGame(false);
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
      endGame(true);
      return;
    }
  }

  state.turn = 'wolf';
  renderTokens();
  renderTurnIndicator();

  setTimeout(() => {
  if (state.gameOver) return;

  const wolfMove = computeWolfMove(GRID_SIZE, state.wolf, state.sheep);
  if (wolfMove) {
    state.wolf.row = wolfMove.row;
    state.wolf.col = wolfMove.col;

    // Capture check: wolf stepped onto the sheep
    if (state.wolf.row === state.sheep.row && state.wolf.col === state.sheep.col) {
    renderTokens();
    endGame(false);
    return;
    }
}

state.turn = 'sheep';
renderTokens();
renderTurnIndicator();
}, 300);

}

document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp': moveSheep(-1, 0); break;
    case 'ArrowDown': moveSheep(1, 0); break;
    case 'ArrowLeft': moveSheep(0, -1); break;
    case 'ArrowRight': moveSheep(0, 1); break;
  }
});

renderGrid();
placeGrass();
renderTokens();
renderTurnIndicator();
