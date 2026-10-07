int evalRPN(char** tokens, int tokensSize) {
    long long* st = malloc(tokensSize * sizeof(long long));
    int top = 0;
    for (int i = 0; i < tokensSize; i++) {
        char* t = tokens[i];
        if (strlen(t) == 1 && strchr("+-*/", t[0])) {
            long long b = st[--top];
            long long a = st[--top];
            switch (t[0]) {
                case '+': st[top++] = a + b; break;
                case '-': st[top++] = a - b; break;
                case '*': st[top++] = a * b; break;
                default:  st[top++] = a / b; break;
            }
        } else {
            st[top++] = atoll(t);
        }
    }
    int r = (int)st[0];
    free(st);
    return r;
}
