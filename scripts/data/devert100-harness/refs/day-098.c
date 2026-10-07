/* A learner's own `struct Node` must not collide with anything the harness
 * defines - the graph Node is only declared for graph problems. */
typedef struct Node {
    int key, value;
    struct Node* prev;
    struct Node* next;
    struct Node* chain;
} Node;

typedef struct {
    int capacity, size, buckets;
    Node** table;
    Node head;   /* most recent after head */
    Node tail;
} LRUCache;

static int slot(LRUCache* c, int key) { return (int)(((unsigned)key * 2654435761u) % (unsigned)c->buckets); }

static void unlink_(Node* n) { n->prev->next = n->next; n->next->prev = n->prev; }

static void pushFront(LRUCache* c, Node* n) {
    n->next = c->head.next; n->prev = &c->head;
    c->head.next->prev = n; c->head.next = n;
}

static Node* find(LRUCache* c, int key) {
    for (Node* n = c->table[slot(c, key)]; n; n = n->chain) if (n->key == key) return n;
    return NULL;
}

static void unchain(LRUCache* c, Node* x) {
    Node** p = &c->table[slot(c, x->key)];
    while (*p != x) p = &(*p)->chain;
    *p = x->chain;
}


LRUCache* lRUCacheCreate(int capacity) {
    LRUCache* c = malloc(sizeof(LRUCache));
    c->capacity = capacity;
    c->size = 0;
    c->buckets = 2 * capacity + 1;
    c->table = calloc(c->buckets, sizeof(Node*));
    c->head.next = &c->tail; c->tail.prev = &c->head;
    c->head.prev = NULL; c->tail.next = NULL;
    return c;
}

int lRUCacheGet(LRUCache* obj, int key) {
    Node* n = find(obj, key);
    if (!n) return -1;
    unlink_(n);
    pushFront(obj, n);
    return n->value;
}

void lRUCachePut(LRUCache* obj, int key, int value) {
    Node* n = find(obj, key);
    if (n) {
        n->value = value;
        unlink_(n);
        pushFront(obj, n);
        return;
    }
    if (obj->size == obj->capacity) {
        Node* lru = obj->tail.prev;
        unlink_(lru);
        unchain(obj, lru);
        free(lru);
        obj->size--;
    }
    n = malloc(sizeof(Node));
    n->key = key; n->value = value;
    int s = slot(obj, key);
    n->chain = obj->table[s];
    obj->table[s] = n;
    pushFront(obj, n);
    obj->size++;
}

void lRUCacheFree(LRUCache* obj) {
    Node* n = obj->head.next;
    while (n != &obj->tail) { Node* nx = n->next; free(n); n = nx; }
    free(obj->table);
    free(obj);
}
