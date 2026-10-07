char* longestCommonPrefix(char** strs, int strsSize) {
    if (strsSize == 0) { char* e = malloc(1); e[0] = 0; return e; }
    int len = strlen(strs[0]);
    for (int i = 1; i < strsSize; i++) {
        int k = 0;
        while (k < len && strs[i][k] && strs[i][k] == strs[0][k]) k++;
        len = k;
    }
    char* out = malloc(len + 1);
    memcpy(out, strs[0], len);
    out[len] = 0;
    return out;
}
