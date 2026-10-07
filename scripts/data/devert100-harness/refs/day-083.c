static int byStart(const void* a, const void* b) {
    int x = (*(int* const*)a)[0], y = (*(int* const*)b)[0];
    return (x > y) - (x < y);
}

/**
 * Return an array of arrays of size *returnSize.
 * The sizes of the arrays are returned as *returnColumnSizes array.
 * Note: Both returned array and *columnSizes array must be malloced, assume caller calls free().
 */
int** merge(int** intervals, int intervalsSize, int* intervalsColSize, int* returnSize, int** returnColumnSizes) {
    qsort(intervals, intervalsSize, sizeof(int*), byStart);
    int** out = malloc((intervalsSize + 1) * sizeof(int*));
    *returnColumnSizes = malloc((intervalsSize + 1) * sizeof(int));
    int n = 0;
    for (int i = 0; i < intervalsSize; i++) {
        if (n > 0 && intervals[i][0] <= out[n - 1][1]) {
            if (intervals[i][1] > out[n - 1][1]) out[n - 1][1] = intervals[i][1];
        } else {
            out[n] = malloc(2 * sizeof(int));
            out[n][0] = intervals[i][0];
            out[n][1] = intervals[i][1];
            (*returnColumnSizes)[n++] = 2;
        }
    }
    *returnSize = n;
    return out;
}
