static int dist(int* p) { return p[0] * p[0] + p[1] * p[1]; }

static int cmpPoint(const void* a, const void* b) {
    int x = dist(*(int* const*)a), y = dist(*(int* const*)b);
    return (x > y) - (x < y);
}

/**
 * Return an array of arrays of size *returnSize.
 * The sizes of the arrays are returned as *returnColumnSizes array.
 * Note: Both returned array and *columnSizes array must be malloced, assume caller calls free().
 */
int** kClosest(int** points, int pointsSize, int* pointsColSize, int k, int* returnSize, int** returnColumnSizes) {
    qsort(points, pointsSize, sizeof(int*), cmpPoint);
    int** out = malloc(k * sizeof(int*));
    *returnColumnSizes = malloc(k * sizeof(int));
    for (int i = 0; i < k; i++) {
        out[i] = malloc(2 * sizeof(int));
        out[i][0] = points[i][0];
        out[i][1] = points[i][1];
        (*returnColumnSizes)[i] = 2;
    }
    *returnSize = k;
    return out;
}
