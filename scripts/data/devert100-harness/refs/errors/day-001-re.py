class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i in range(len(nums) + 1):
            x = nums[i]  # DV100-EXPECT reads one past the end
            seen[x] = i
        return []
