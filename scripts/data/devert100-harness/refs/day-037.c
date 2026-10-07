typedef struct {
    int* vals;
    int* mins;
    int size;
    int cap;
} MinStack;


MinStack* minStackCreate() {
    MinStack* s = malloc(sizeof(MinStack));
    s->cap = 16;
    s->size = 0;
    s->vals = malloc(s->cap * sizeof(int));
    s->mins = malloc(s->cap * sizeof(int));
    return s;
}

void minStackPush(MinStack* obj, int val) {
    if (obj->size == obj->cap) {
        obj->cap *= 2;
        obj->vals = realloc(obj->vals, obj->cap * sizeof(int));
        obj->mins = realloc(obj->mins, obj->cap * sizeof(int));
    }
    int m = obj->size ? obj->mins[obj->size - 1] : val;
    obj->vals[obj->size] = val;
    obj->mins[obj->size] = val < m ? val : m;
    obj->size++;
}

void minStackPop(MinStack* obj) {
    obj->size--;
}

int minStackTop(MinStack* obj) {
    return obj->vals[obj->size - 1];
}

int minStackGetMin(MinStack* obj) {
    return obj->mins[obj->size - 1];
}

void minStackFree(MinStack* obj) {
    free(obj->vals);
    free(obj->mins);
    free(obj);
}
