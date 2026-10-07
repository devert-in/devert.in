char* longestPalindrome(char* s) {
    int n = strlen(s), best = 0, start = 0;
    for (int c = 0; c < n; c++) {
        for (int odd = 0; odd < 2; odd++) {
            int l = c, r = c + odd;
            while (l >= 0 && r < n && s[l] == s[r]) { l--; r++; }
            if (r - l - 1 > best) { best = r - l - 1; start = l + 1; }
        }
    }
    char* out = malloc(best + 1);
    memcpy(out, s + start, best);
    out[best] = 0;
    return out;
}
