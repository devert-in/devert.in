class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        m, n = len(grid), len(grid[0])
        count = 0
        for i in range(m):
            for j in range(n):
                if grid[i][j] == "1":
                    count += 1
                    st = [(i, j)]
                    grid[i][j] = "0"
                    while st:
                        a, b = st.pop()
                        for x, y in ((a + 1, b), (a - 1, b), (a, b + 1), (a, b - 1)):
                            if 0 <= x < m and 0 <= y < n and grid[x][y] == "1":
                                grid[x][y] = "0"
                                st.append((x, y))
        return count
