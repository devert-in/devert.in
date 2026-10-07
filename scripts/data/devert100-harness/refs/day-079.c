static int **g, *gn, *disc, *low, timer_;
static int **out, outN;

static void dfs(int u, int parent) {
    disc[u] = low[u] = ++timer_;
    for (int i = 0; i < gn[u]; i++) {
        int v = g[u][i];
        if (v == parent) continue;
        if (disc[v]) { if (disc[v] < low[u]) low[u] = disc[v]; }
        else {
            dfs(v, u);
            if (low[v] < low[u]) low[u] = low[v];
            if (low[v] > disc[u]) {
                out[outN] = malloc(2 * sizeof(int));
                out[outN][0] = u;
                out[outN][1] = v;
                outN++;
            }
        }
    }
}

/**
 * Return an array of arrays of size *returnSize.
 * The sizes of the arrays are returned as *returnColumnSizes array.
 * Note: Both returned array and *columnSizes array must be malloced, assume caller calls free().
 */
int** criticalConnections(int n, int** connections, int connectionsSize, int* connectionsColSize, int* returnSize, int** returnColumnSizes) {
    int* deg = calloc(n, sizeof(int));
    for (int i = 0; i < connectionsSize; i++) { deg[connections[i][0]]++; deg[connections[i][1]]++; }
    g = malloc(n * sizeof(int*));
    gn = calloc(n, sizeof(int));
    for (int i = 0; i < n; i++) g[i] = malloc((deg[i] + 1) * sizeof(int));
    for (int i = 0; i < connectionsSize; i++) {
        int a = connections[i][0], b = connections[i][1];
        g[a][gn[a]++] = b;
        g[b][gn[b]++] = a;
    }
    disc = calloc(n, sizeof(int));
    low = calloc(n, sizeof(int));
    timer_ = 0;
    out = malloc((connectionsSize + 1) * sizeof(int*));
    outN = 0;
    for (int i = 0; i < n; i++) if (!disc[i]) dfs(i, -1);
    *returnSize = outN;
    *returnColumnSizes = malloc((outN + 1) * sizeof(int));
    for (int i = 0; i < outN; i++) (*returnColumnSizes)[i] = 2;
    return out;
}
