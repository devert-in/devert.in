static int cmpInt(const void* a, const void* b) {
    int x = *(const int*)a, y = *(const int*)b;
    return (x > y) - (x < y);
}

/**
 * Return an array of arrays of size *returnSize.
 * The sizes of the arrays are returned as *returnColumnSizes array.
 * Note: Both returned array and *columnSizes array must be malloced, assume caller calls free().
 */
int** threeSum(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {
    qsort(nums, numsSize, sizeof(int), cmpInt);
    int cap = 16, cnt = 0;
    int** out = malloc(cap * sizeof(int*));
    for (int i = 0; i < numsSize - 2; i++) {
        if (i > 0 && nums[i] == nums[i - 1]) continue;
        int l = i + 1, r = numsSize - 1;
        while (l < r) {
            int s = nums[i] + nums[l] + nums[r];
            if (s < 0) l++;
            else if (s > 0) r--;
            else {
                if (cnt == cap) { cap *= 2; out = realloc(out, cap * sizeof(int*)); }
                out[cnt] = malloc(3 * sizeof(int));
                out[cnt][0] = nums[i]; out[cnt][1] = nums[l]; out[cnt][2] = nums[r];
                cnt++;
                while (l < r && nums[l] == nums[l + 1]) l++;
                while (l < r && nums[r] == nums[r - 1]) r--;
                l++; r--;
            }
        }
    }
    *returnSize = cnt;
    *returnColumnSizes = malloc((cnt ? cnt : 1) * sizeof(int));
    for (int i = 0; i < cnt; i++) (*returnColumnSizes)[i] = 3;
    return out;
}
