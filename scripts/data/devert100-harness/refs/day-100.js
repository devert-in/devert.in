/**
 * @param {character[][]} board
 * @param {string} word
 * @return {boolean}
 */
var exist = function(board, word) {
    const m = board.length, n = m ? board[0].length : 0;
    const dfs = (r, c, i) => {
        if (i === word.length) return true;
        if (r < 0 || c < 0 || r >= m || c >= n || board[r][c] !== word[i]) return false;
        const ch = board[r][c];
        board[r][c] = "#";
        const ok = dfs(r + 1, c, i + 1) || dfs(r - 1, c, i + 1) || dfs(r, c + 1, i + 1) || dfs(r, c - 1, i + 1);
        board[r][c] = ch;
        return ok;
    };
    for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (dfs(r, c, 0)) return true;
    return false;
};
