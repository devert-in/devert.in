class Solution:
    def nearlySorted(self, arr: List[int], k: int) -> None:
        h = []
        w = 0
        for x in arr[:]:
            heappush(h, x)
            if len(h) > k:
                arr[w] = heappop(h)
                w += 1
        while h:
            arr[w] = heappop(h)
            w += 1
