static int *disc, *low, timer_;
static bool* ap;

static void dfs(int u, int parent, int** adj, int* adjColSize) {
    disc[u] = low[u] = ++timer_;
    int children = 0;
    for (int i = 0; i < adjColSize[u]; i++) {
        int v = adj[u][i];
        if (v == parent) continue;
        if (disc[v]) { if (disc[v] < low[u]) low[u] = disc[v]; }
        else {
            children++;
            dfs(v, u, adj, adjColSize);
            if (low[v] < low[u]) low[u] = low[v];
            if (parent != -1 && low[v] >= disc[u]) ap[u] = true;
        }
    }
    if (parent == -1 && children > 1) ap[u] = true;
}

/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* articulationPoints(int V, int** adj, int adjSize, int* adjColSize, int* returnSize) {
    disc = calloc(V, sizeof(int));
    low = calloc(V, sizeof(int));
    ap = calloc(V, sizeof(bool));
    timer_ = 0;
    for (int i = 0; i < V; i++) if (!disc[i]) dfs(i, -1, adj, adjColSize);
    int* out = malloc((V + 1) * sizeof(int));
    *returnSize = 0;
    for (int i = 0; i < V; i++) if (ap[i]) out[(*returnSize)++] = i;
    if (*returnSize == 0) out[(*returnSize)++] = -1;
    return out;
}
