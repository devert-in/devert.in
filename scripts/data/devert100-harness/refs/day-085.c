static void push(long long* h, int* n, long long v) {
    int i = (*n)++;
    h[i] = v;
    while (i > 0 && h[(i - 1) / 2] > h[i]) {
        int p = (i - 1) / 2;
        long long t = h[p]; h[p] = h[i]; h[i] = t;
        i = p;
    }
}

static long long pop(long long* h, int* n) {
    long long top = h[0];
    h[0] = h[--(*n)];
    int i = 0;
    for (;;) {
        int s = i, l = 2 * i + 1, r = l + 1;
        if (l < *n && h[l] < h[s]) s = l;
        if (r < *n && h[r] < h[s]) s = r;
        if (s == i) break;
        long long t = h[s]; h[s] = h[i]; h[i] = t;
        i = s;
    }
    return top;
}

long long minCost(int* arr, int arrSize) {
    long long* h = malloc((arrSize + 1) * sizeof(long long));
    int n = 0;
    for (int i = 0; i < arrSize; i++) push(h, &n, arr[i]);
    long long total = 0;
    while (n > 1) {
        long long a = pop(h, &n);
        long long b = pop(h, &n);
        total += a + b;
        push(h, &n, a + b);
    }
    free(h);
    return total;
}
