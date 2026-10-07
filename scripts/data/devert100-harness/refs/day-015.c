int removeDuplicates(int* nums, int numsSize) {
    if (numsSize == 0) return 0;
    int w = 1;
    for (int i = 1; i < numsSize; i++)
        if (nums[i] != nums[w - 1]) nums[w++] = nums[i];
    return w;
}
