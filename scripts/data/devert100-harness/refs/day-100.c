static bool dfs(char** board, int rows, int* cols, char* word, int r, int c) {
    if (*word == 0) return true;
    if (r < 0 || r >= rows || c < 0 || c >= cols[r] || board[r][c] != *word) return false;
    char saved = board[r][c];
    board[r][c] = '#';
    bool found = dfs(board, rows, cols, word + 1, r + 1, c)
              || dfs(board, rows, cols, word + 1, r - 1, c)
              || dfs(board, rows, cols, word + 1, r, c + 1)
              || dfs(board, rows, cols, word + 1, r, c - 1);
    board[r][c] = saved;
    return found;
}

bool exist(char** board, int boardSize, int* boardColSize, char* word) {
    for (int r = 0; r < boardSize; r++)
        for (int c = 0; c < boardColSize[r]; c++)
            if (dfs(board, boardSize, boardColSize, word, r, c)) return true;
    return false;
}
