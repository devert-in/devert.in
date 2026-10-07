class Solution:
    def minPartition(self, N: int) -> List[int]:
        out = []
        for c in (2000, 500, 200, 100, 50, 20, 10, 5, 2, 1):
            while N >= c:
                out.append(c)
                N -= c
        return out
