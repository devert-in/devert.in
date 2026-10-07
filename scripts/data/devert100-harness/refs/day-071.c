/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* findOrder(int numCourses, int** prerequisites, int prerequisitesSize, int* prerequisitesColSize, int* returnSize) {
    int* indeg = calloc(numCourses, sizeof(int));
    int* deg = calloc(numCourses, sizeof(int));
    for (int i = 0; i < prerequisitesSize; i++) { indeg[prerequisites[i][0]]++; deg[prerequisites[i][1]]++; }
    int** next = malloc(numCourses * sizeof(int*));
    int* fill = calloc(numCourses, sizeof(int));
    for (int i = 0; i < numCourses; i++) next[i] = malloc((deg[i] + 1) * sizeof(int));
    for (int i = 0; i < prerequisitesSize; i++) {
        int b = prerequisites[i][1];
        next[b][fill[b]++] = prerequisites[i][0];
    }
    int* order = malloc((numCourses + 1) * sizeof(int));
    int head = 0, tail = 0;
    for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) order[tail++] = i;
    while (head < tail) {
        int u = order[head++];
        for (int k = 0; k < fill[u]; k++) if (--indeg[next[u][k]] == 0) order[tail++] = next[u][k];
    }
    *returnSize = tail == numCourses ? numCourses : 0;
    return order;
}
