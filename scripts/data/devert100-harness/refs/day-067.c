/**
 * Definition for a Node.
 * struct Node {
 *     int val;
 *     int numNeighbors;
 *     struct Node** neighbors;
 * };
 */

static struct Node* copies[101];

static struct Node* clone(struct Node* s) {
    if (copies[s->val]) return copies[s->val];
    struct Node* c = malloc(sizeof(struct Node));
    c->val = s->val;
    c->numNeighbors = s->numNeighbors;
    c->neighbors = malloc((s->numNeighbors + 1) * sizeof(struct Node*));
    copies[s->val] = c;
    for (int i = 0; i < s->numNeighbors; i++) c->neighbors[i] = clone(s->neighbors[i]);
    return c;
}

struct Node *cloneGraph(struct Node *s) {
    memset(copies, 0, sizeof copies);
    if (s == NULL) return NULL;
    return clone(s);
}
