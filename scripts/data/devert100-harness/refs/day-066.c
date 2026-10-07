static void sink(char** grid, int rows, int* cols, int r, int c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols[r] || grid[r][c] != '1') return;
    grid[r][c] = '0';
    sink(grid, rows, cols, r + 1, c);
    sink(grid, rows, cols, r - 1, c);
    sink(grid, rows, cols, r, c + 1);
    sink(grid, rows, cols, r, c - 1);
}

int numIslands(char** grid, int gridSize, int* gridColSize) {
    int islands = 0;
    for (int r = 0; r < gridSize; r++)
        for (int c = 0; c < gridColSize[r]; c++)
            if (grid[r][c] == '1') { islands++; sink(grid, gridSize, gridColSize, r, c); }
    return islands;
}
