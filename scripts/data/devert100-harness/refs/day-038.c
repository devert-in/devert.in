typedef struct {
    int in[1000];
    int inTop;
    int out[1000];
    int outTop;
} MyQueue;


MyQueue* myQueueCreate() {
    return calloc(1, sizeof(MyQueue));
}

void myQueuePush(MyQueue* obj, int x) {
    obj->in[obj->inTop++] = x;
}

static void shift(MyQueue* obj) {
    if (obj->outTop == 0)
        while (obj->inTop > 0) obj->out[obj->outTop++] = obj->in[--obj->inTop];
}

int myQueuePop(MyQueue* obj) {
    shift(obj);
    return obj->out[--obj->outTop];
}

int myQueuePeek(MyQueue* obj) {
    shift(obj);
    return obj->out[obj->outTop - 1];
}

bool myQueueEmpty(MyQueue* obj) {
    return obj->inTop == 0 && obj->outTop == 0;
}

void myQueueFree(MyQueue* obj) {
    free(obj);
}
