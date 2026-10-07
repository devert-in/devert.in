static int cmpChar(const void* a, const void* b) { return *(const char*)a - *(const char*)b; }

typedef struct { char* key; int idx; } Entry;

static int cmpEntry(const void* a, const void* b) {
    const Entry* x = a;
    const Entry* y = b;
    int c = strcmp(x->key, y->key);
    return c ? c : x->idx - y->idx;
}

/**
 * Return an array of arrays of size *returnSize.
 * The sizes of the arrays are returned as *returnColumnSizes array.
 * Note: Both returned array and *columnSizes array must be malloced, assume caller calls free().
 */
char*** groupAnagrams(char** strs, int strsSize, int* returnSize, int** returnColumnSizes) {
    int m = strsSize ? strsSize : 1;
    Entry* e = malloc(m * sizeof(Entry));
    for (int i = 0; i < strsSize; i++) {
        e[i].key = strdup(strs[i]);
        qsort(e[i].key, strlen(e[i].key), 1, cmpChar);
        e[i].idx = i;
    }
    qsort(e, strsSize, sizeof(Entry), cmpEntry);
    char*** out = malloc(m * sizeof(char**));
    *returnColumnSizes = malloc(m * sizeof(int));
    int g = 0;
    for (int i = 0; i < strsSize; ) {
        int j = i;
        while (j < strsSize && strcmp(e[j].key, e[i].key) == 0) j++;
        out[g] = malloc((j - i) * sizeof(char*));
        for (int k = i; k < j; k++) out[g][k - i] = strs[e[k].idx];
        (*returnColumnSizes)[g++] = j - i;
        i = j;
    }
    *returnSize = g;
    return out;
}
