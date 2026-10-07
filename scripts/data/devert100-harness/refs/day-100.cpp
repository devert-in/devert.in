class Solution {
    bool dfs(vector<vector<char>>& b, const string& w, int i, int r, int c) {
        if (i == (int)w.size()) return true;
        if (r < 0 || c < 0 || r >= (int)b.size() || c >= (int)b[0].size() || b[r][c] != w[i]) return false;
        char saved = b[r][c];
        b[r][c] = '#';
        bool ok = dfs(b, w, i + 1, r + 1, c) || dfs(b, w, i + 1, r - 1, c) || dfs(b, w, i + 1, r, c + 1) || dfs(b, w, i + 1, r, c - 1);
        b[r][c] = saved;
        return ok;
    }
public:
    bool exist(vector<vector<char>>& board, string word) {
        for (int r = 0; r < (int)board.size(); r++)
            for (int c = 0; c < (int)board[r].size(); c++)
                if (dfs(board, word, 0, r, c)) return true;
        return false;
    }
};
