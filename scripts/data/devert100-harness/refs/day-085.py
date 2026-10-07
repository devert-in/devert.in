class Solution:
    def minCost(self, arr: List[int]) -> int:
        h = list(arr)
        heapify(h)
        cost = 0
        while len(h) > 1:
            s = heappop(h) + heappop(h)
            cost += s
            heappush(h, s)
        return cost
