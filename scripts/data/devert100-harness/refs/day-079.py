class Solution:
    def criticalConnections(self, n: int, connections: List[List[int]]) -> List[List[int]]:
        g = [[] for _ in range(n)]
        for a, b in connections:
            g[a].append(b)
            g[b].append(a)
        disc = [-1] * n
        low = [0] * n
        res = []
        t = 0
        def dfs(u, parent):
            nonlocal t
            disc[u] = low[u] = t
            t += 1
            for v in g[u]:
                if v == parent:
                    continue
                if disc[v] == -1:
                    dfs(v, u)
                    low[u] = min(low[u], low[v])
                    if low[v] > disc[u]:
                        res.append([u, v])
                else:
                    low[u] = min(low[u], disc[v])
        for i in range(n):
            if disc[i] == -1:
                dfs(i, -1)
        return res
