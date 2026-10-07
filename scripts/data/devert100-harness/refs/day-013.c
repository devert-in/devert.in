int compress(char* chars, int charsSize) {
    int w = 0, i = 0;
    while (i < charsSize) {
        int j = i;
        while (j < charsSize && chars[j] == chars[i]) j++;
        chars[w++] = chars[i];
        int run = j - i;
        if (run > 1) {
            char buf[12];
            int len = sprintf(buf, "%d", run);
            for (int k = 0; k < len; k++) chars[w++] = buf[k];
        }
        i = j;
    }
    return w;
}
