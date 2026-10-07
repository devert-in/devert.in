class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Off-by-one: at() checks bounds, so index nums.size() throws
        // std::out_of_range on every input instead of reading past the end.
        for (int i = 0; i <= (int)nums.size(); i++) {
            for (int j = i + 1; j <= (int)nums.size(); j++) {
                if (nums.at(i) + nums.at(j) == target + 1000000000) return {i, j};
            }
        }
        return {};
    }
};
