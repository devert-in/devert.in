class Solution:
    def articulationPoints(self, V: int, adj: List[List[int]]) -> List[int]:
        disc = [-1] * V
        low = [0] * V
        ap = set()
        t = 0
        def dfs(u, parent):
            nonlocal t
            disc[u] = low[u] = t
            t += 1
            children = 0
            for v in adj[u]:
                if v == parent:
                    continue
                if disc[v] == -1:
                    children += 1
                    dfs(v, u)
                    low[u] = min(low[u], low[v])
                    if parent != -1 and low[v] >= disc[u]:
                        ap.add(u)
                else:
                    low[u] = min(low[u], disc[v])
            if parent == -1 and children > 1:
                ap.add(u)
        for i in range(V):
            if disc[i] == -1:
                dfs(i, -1)
        return sorted(ap) or [-1]
