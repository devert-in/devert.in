class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, x in enumerate(nums)  # DV100-EXPECT missing colon
            if target - x in seen:
                return [seen[target - x], i]
            seen[x] = i
        return []
