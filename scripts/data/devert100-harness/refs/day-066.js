/**
 * @param {character[][]} grid
 * @return {number}
 */
var numIslands = function(grid) {
    let count = 0;
    const sink = (r, c) => {
        if (r < 0 || c < 0 || r >= grid.length || c >= grid[r].length || grid[r][c] !== "1") return;
        grid[r][c] = "0";
        sink(r + 1, c); sink(r - 1, c); sink(r, c + 1); sink(r, c - 1);
    };
    for (let r = 0; r < grid.length; r++)
        for (let c = 0; c < grid[r].length; c++)
            if (grid[r][c] === "1") { count++; sink(r, c); }
    return count;
};
