static void siftDown(int* h, int n, int i) {
    for (;;) {
        int s = i, l = 2 * i + 1, r = l + 1;
        if (l < n && h[l] < h[s]) s = l;
        if (r < n && h[r] < h[s]) s = r;
        if (s == i) return;
        int t = h[s]; h[s] = h[i]; h[i] = t;
        i = s;
    }
}

static void siftUp(int* h, int i) {
    while (i > 0 && h[(i - 1) / 2] > h[i]) {
        int p = (i - 1) / 2, t = h[p]; h[p] = h[i]; h[i] = t;
        i = p;
    }
}

void nearlySorted(int* arr, int arrSize, int k) {
    int* heap = malloc((k + 2) * sizeof(int));
    int n = 0, w = 0;
    for (int i = 0; i < arrSize; i++) {
        heap[n] = arr[i];
        siftUp(heap, n++);
        if (n > k) {
            arr[w++] = heap[0];
            heap[0] = heap[--n];
            siftDown(heap, n, 0);
        }
    }
    while (n > 0) {
        arr[w++] = heap[0];
        heap[0] = heap[--n];
        siftDown(heap, n, 0);
    }
    free(heap);
}
