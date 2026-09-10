// Wolf AI — Tier 1: Greedy BFS pursuit.
// Finds the shortest path to the sheep and returns the FIRST step of it.

function computeWolfMove(gridSize, wolf, sheep) {
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
