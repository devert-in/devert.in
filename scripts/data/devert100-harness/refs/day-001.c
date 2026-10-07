/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    int cap = 1;
    while (cap < 2 * numsSize) cap <<= 1;
    int* keys = malloc(cap * sizeof(int));
    int* idx = malloc(cap * sizeof(int));
    for (int i = 0; i < cap; i++) idx[i] = -1;
    int* res = malloc(2 * sizeof(int));
    *returnSize = 0;
    for (int i = 0; i < numsSize; i++) {
        int need = target - nums[i];
        unsigned h = ((unsigned)need * 2654435761u) & (cap - 1);
        while (idx[h] != -1) {
            if (keys[h] == need) { res[0] = idx[h]; res[1] = i; *returnSize = 2; free(keys); free(idx); return res; }
            h = (h + 1) & (cap - 1);
        }
        h = ((unsigned)nums[i] * 2654435761u) & (cap - 1);
        while (idx[h] != -1) h = (h + 1) & (cap - 1);
        keys[h] = nums[i]; idx[h] = i;
    }
    free(keys); free(idx);
    return res;
}
