static bool dfs(int u, int parent, int** adj, int* adjColSize, bool* seen) {
    seen[u] = true;
    for (int i = 0; i < adjColSize[u]; i++) {
        int v = adj[u][i];
        if (!seen[v]) { if (dfs(v, u, adj, adjColSize, seen)) return true; }
        else if (v != parent) return true;
    }
    return false;
}

bool isCycle(int V, int** adj, int adjSize, int* adjColSize) {
    bool* seen = calloc(V + 1, sizeof(bool));
    bool found = false;
    for (int i = 0; i < V && !found; i++)
        if (!seen[i] && dfs(i, -1, adj, adjColSize, seen)) found = true;
    free(seen);
    return found;
}
