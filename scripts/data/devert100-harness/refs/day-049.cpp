class Solution {
public:
    bool searchMatrix(vector<vector<int>>& matrix, int target) {
        int r = 0, c = (int)matrix[0].size() - 1;
        while (r < (int)matrix.size() && c >= 0) {
            int v = matrix[r][c];
            if (v == target) return true;
            if (v > target) c--; else r++;
        }
        return false;
    }
};
