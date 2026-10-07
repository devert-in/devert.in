typedef struct {
    int* lo;   /* max-heap: the smaller half */
    int* hi;   /* min-heap: the larger half */
    int nlo, nhi;
} MedianFinder;

static void push(int* h, int* n, int v, int sign) {
    int i = (*n)++;
    h[i] = v;
    while (i > 0 && sign * h[(i - 1) / 2] > sign * h[i]) {
        int p = (i - 1) / 2, t = h[p]; h[p] = h[i]; h[i] = t; i = p;
    }
}

static int pop(int* h, int* n, int sign) {
    int top = h[0];
    h[0] = h[--(*n)];
    int i = 0;
    for (;;) {
        int s = i, l = 2 * i + 1, r = l + 1;
        if (l < *n && sign * h[l] < sign * h[s]) s = l;
        if (r < *n && sign * h[r] < sign * h[s]) s = r;
        if (s == i) break;
        int t = h[s]; h[s] = h[i]; h[i] = t; i = s;
    }
    return top;
}


MedianFinder* medianFinderCreate() {
    MedianFinder* m = malloc(sizeof(MedianFinder));
    m->lo = malloc(50001 * sizeof(int));
    m->hi = malloc(50001 * sizeof(int));
    m->nlo = m->nhi = 0;
    return m;
}

void medianFinderAddNum(MedianFinder* obj, int num) {
    push(obj->lo, &obj->nlo, num, -1);
    push(obj->hi, &obj->nhi, pop(obj->lo, &obj->nlo, -1), 1);
    if (obj->nhi > obj->nlo) push(obj->lo, &obj->nlo, pop(obj->hi, &obj->nhi, 1), -1);
}

double medianFinderFindMedian(MedianFinder* obj) {
    if (obj->nlo > obj->nhi) return obj->lo[0];
    return ((double)obj->lo[0] + obj->hi[0]) / 2.0;
}

void medianFinderFree(MedianFinder* obj) {
    free(obj->lo);
    free(obj->hi);
    free(obj);
}
