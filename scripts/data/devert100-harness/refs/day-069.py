class Solution:
    def isCycle(self, V: int, adj: List[List[int]]) -> bool:
        seen = [False] * V
        for s in range(V):
            if seen[s]:
                continue
            seen[s] = True
            q = deque([(s, -1)])
            while q:
                u, parent = q.popleft()
                for v in adj[u]:
                    if not seen[v]:
                        seen[v] = True
                        q.append((v, u))
                    elif v != parent:
                        return True
        return False
