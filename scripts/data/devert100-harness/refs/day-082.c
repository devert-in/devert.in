static int* gVal;
static int* gWt;

static int byRatio(const void* a, const void* b) {
    int i = *(const int*)a, j = *(const int*)b;
    /* v_i / w_i > v_j / w_j, compared without division */
    long long lhs = (long long)gVal[i] * gWt[j], rhs = (long long)gVal[j] * gWt[i];
    return (lhs < rhs) - (lhs > rhs);
}

double fractionalKnapsack(int* val, int valSize, int* wt, int wtSize, int capacity) {
    int* order = malloc(valSize * sizeof(int));
    for (int i = 0; i < valSize; i++) order[i] = i;
    gVal = val;
    gWt = wt;
    qsort(order, valSize, sizeof(int), byRatio);
    double total = 0.0;
    for (int k = 0; k < valSize && capacity > 0; k++) {
        int i = order[k];
        int take = wt[i] < capacity ? wt[i] : capacity;
        total += (double)val[i] * take / wt[i];
        capacity -= take;
    }
    free(order);
    return total;
}
