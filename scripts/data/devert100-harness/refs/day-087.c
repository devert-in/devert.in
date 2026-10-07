/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* minPartition(int N, int* returnSize) {
    static const int coins[] = { 2000, 500, 200, 100, 50, 20, 10, 5, 2, 1 };
    int cap = 16;
    int* out = malloc(cap * sizeof(int));
    *returnSize = 0;
    for (int i = 0; i < 10; i++) {
        while (N >= coins[i]) {
            if (*returnSize == cap) { cap *= 2; out = realloc(out, cap * sizeof(int)); }
            out[(*returnSize)++] = coins[i];
            N -= coins[i];
        }
    }
    return out;
}
