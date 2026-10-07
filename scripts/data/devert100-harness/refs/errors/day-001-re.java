import java.util.HashMap;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        HashMap<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i <= nums.length; i++) {
            int x = valueAt(nums, i);
            seen.put(x, i);
        }
        return new int[0];
    }

    private int valueAt(int[] nums, int i) {
        return nums[i]; // DV100-EXPECT reads one past the end
    }
}
