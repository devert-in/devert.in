class Solution:
    def findMaxAverage(self, nums: List[int], k: int) -> float:
        cur = best = sum(nums[:k])
        for i in range(k, len(nums)):
            cur += nums[i] - nums[i - k]
            best = max(best, cur)
        return best / k
