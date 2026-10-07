/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     struct ListNode *next;
 * };
 */

static void sift(struct ListNode** h, int n, int i) {
    for (;;) {
        int s = i, l = 2 * i + 1, r = l + 1;
        if (l < n && h[l]->val < h[s]->val) s = l;
        if (r < n && h[r]->val < h[s]->val) s = r;
        if (s == i) return;
        struct ListNode* t = h[s]; h[s] = h[i]; h[i] = t;
        i = s;
    }
}

struct ListNode* mergeKLists(struct ListNode** lists, int listsSize) {
    struct ListNode** heap = malloc((listsSize + 1) * sizeof(struct ListNode*));
    int n = 0;
    for (int i = 0; i < listsSize; i++) if (lists[i]) heap[n++] = lists[i];
    for (int i = n / 2 - 1; i >= 0; i--) sift(heap, n, i);
    struct ListNode dummy;
    struct ListNode* tail = &dummy;
    dummy.next = NULL;
    while (n > 0) {
        struct ListNode* top = heap[0];
        tail->next = top;
        tail = top;
        if (top->next) heap[0] = top->next;
        else heap[0] = heap[--n];
        sift(heap, n, 0);
    }
    tail->next = NULL;
    free(heap);
    return dummy.next;
}
