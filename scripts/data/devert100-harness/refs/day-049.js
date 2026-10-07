/**
 * @param {number[][]} matrix
 * @param {number} target
 * @return {boolean}
 */
var searchMatrix = function(matrix, target) {
    // Rows and columns are each sorted: walk from the top-right corner.
    let r = 0, c = matrix.length ? matrix[0].length - 1 : -1;
    while (r < matrix.length && c >= 0) {
        const v = matrix[r][c];
        if (v === target) return true;
        if (v > target) c--; else r++;
    }
    return false;
};
