// Wolf AI — Tier 1: Greedy BFS pursuit.
// Finds the shortest path to the sheep and returns the FIRST step of it.

function computeWolfMove(gridSize, wolf, sheep,obstacles=[]) {
  if (wolf.row === sheep.row && wolf.col === sheep.col) {
    return null; // already on the sheep; shouldn't happen, but be safe
  }

  // BFS state: we track which cell we came from, so we can
  // walk the path backwards once the sheep is found.
  const cameFrom = new Map();
  const key = (r, c) => r + ',' + c;
  const start = key(wolf.row, wolf.col);
  const target = key(sheep.row, sheep.col);

  const queue = [{ row: wolf.row, col: wolf.col }];
  const visited = new Set([start]);
  const isObstacle = (r, c) => obstacles.some(o => o.row === r && o.col === c);
  const directions = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 }
  ];

  while (queue.length > 0) {
    const current = queue.shift();

    for (const dir of directions) {
      const nextRow = current.row + dir.row;
      const nextCol = current.col + dir.col;

      if (nextRow < 0 || nextRow >= gridSize ||
          nextCol < 0 || nextCol >= gridSize) {
        continue;
      }

      if (isObstacle(nextRow, nextCol)) continue;   // <-- new

      const nextKey = key(nextRow, nextCol);
      if (visited.has(nextKey)) continue;

      visited.add(nextKey);
      cameFrom.set(nextKey, key(current.row, current.col));

      if (nextKey === target) {
        // Reconstruct the path back to the wolf's start, then
        // return the cell right after the start (the first step).
        let step = nextKey;
        while (cameFrom.get(step) !== start) {
          step = cameFrom.get(step);
        }
        const [r, c] = step.split(',');
        return { row: Number(r), col: Number(c) };
      }

      queue.push({ row: nextRow, col: nextCol });
    }
  }

  return null; // unreachable (can't happen on an open grid)
}
// Real shortest-path distance (accounts for obstacles), reusing BFS.
function bfsDistance(start, target, obstacles, gridSize) {
  if (start.row === target.row && start.col === target.col) return 0;

  const isObstacle = (r, c) => obstacles.some(o => o.row === r && o.col === c);
  const key = (r, c) => r + ',' + c;
  const visited = new Set([key(start.row, start.col)]);
  const queue = [{ row: start.row, col: start.col, dist: 0 }];

  const directions = [
    { row: -1, col: 0 }, { row: 1, col: 0 },
    { row: 0, col: -1 }, { row: 0, col: 1 }
  ];

  while (queue.length > 0) {
    const current = queue.shift();

    for (const dir of directions) {
      const nextRow = current.row + dir.row;
      const nextCol = current.col + dir.col;

      if (nextRow < 0 || nextRow >= gridSize || nextCol < 0 || nextCol >= gridSize) continue;
      if (isObstacle(nextRow, nextCol)) continue;

      const nextKey = key(nextRow, nextCol);
      if (visited.has(nextKey)) continue;
      visited.add(nextKey);

      if (nextRow === target.row && nextCol === target.col) {
        return current.dist + 1;
      }

      queue.push({ row: nextRow, col: nextCol, dist: current.dist + 1 });
    }
  }

  return Infinity; // unreachable
}

function manhattanDistance(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function generateMoves(pos, obstacles, gridSize) {
  const directions = [
    { row: -1, col: 0 }, { row: 1, col: 0 },
    { row: 0, col: -1 }, { row: 0, col: 1 }
  ];
  const isObstacle = (r, c) => obstacles.some(o => o.row === r && o.col === c);

  return directions
    .map(d => ({ row: pos.row + d.row, col: pos.col + d.col }))
    .filter(p =>
      p.row >= 0 && p.row < gridSize &&
      p.col >= 0 && p.col < gridSize &&
      !isObstacle(p.row, p.col)
    );
}

// Recursive minimax with alpha-beta pruning.
// isWolfTurn=true  -> minimizing player (wolf wants distance SMALL)
// isWolfTurn=false -> maximizing player (sheep wants distance LARGE)
function minimax(wolfPos, sheepPos, obstacles, gridSize, depth, isWolfTurn, alpha, beta) {
  if (depth === 0 || (wolfPos.row === sheepPos.row && wolfPos.col === sheepPos.col)) {
    return bfsDistance(wolfPos, sheepPos, obstacles, gridSize);
  }

  const currentPos = isWolfTurn ? wolfPos : sheepPos;
  const moves = generateMoves(currentPos, obstacles, gridSize);

  if (moves.length === 0) {
    return bfsDistance(wolfPos, sheepPos, obstacles, gridSize); // stuck — can't improve
  }

  if (isWolfTurn) {
    let best = Infinity;
    for (const move of moves) {
      const value = minimax(move, sheepPos, obstacles, gridSize, depth - 1, false, alpha, beta);
      best = Math.min(best, value);
      beta = Math.min(beta, best);
      if (beta <= alpha) break; // prune
    }
    return best;
  } else {
    let best = -Infinity;
    for (const move of moves) {
      const value = minimax(wolfPos, move, obstacles, gridSize, depth - 1, true, alpha, beta);
      best = Math.max(best, value);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break; // prune
    }
    return best;
  }
}

// Tier 2: Minimax pursuit. Returns the wolf's best immediate move.
function computeWolfMoveMinimax(gridSize, wolf, sheep, obstacles = [], depth = 5) {
  const candidateMoves = generateMoves(wolf, obstacles, gridSize);
  if (candidateMoves.length === 0) return null;

  let bestMove = null;
  let bestValue = Infinity;

  for (const move of candidateMoves) {
    const value = minimax(move, sheep, obstacles, gridSize, depth - 1, false, -Infinity, Infinity);
    if (value < bestValue) {
      bestValue = value;
      bestMove = move;
    }
  }

  return bestMove;
}