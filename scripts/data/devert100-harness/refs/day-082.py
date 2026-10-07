class Solution:
    def fractionalKnapsack(self, val: List[int], wt: List[int], capacity: int) -> float:
        total = 0.0
        for v, w in sorted(zip(val, wt), key=lambda p: -p[0] / p[1]):
            take = min(w, capacity)
            total += v * take / w
            capacity -= take
            if capacity == 0:
                break
        return total
