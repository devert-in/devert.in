/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     struct TreeNode *left;
 *     struct TreeNode *right;
 * };
 */
/**
 * Return an array of arrays of size *returnSize.
 * The sizes of the arrays are returned as *returnColumnSizes array.
 * Note: Both returned array and *columnSizes array must be malloced, assume caller calls free().
 */
int** levelOrder(struct TreeNode* root, int* returnSize, int** returnColumnSizes) {
    struct TreeNode* q[2001];
    int head = 0, tail = 0;
    int** out = malloc(2001 * sizeof(int*));
    *returnColumnSizes = malloc(2001 * sizeof(int));
    *returnSize = 0;
    if (root) q[tail++] = root;
    while (head < tail) {
        int width = tail - head;
        int* level = malloc(width * sizeof(int));
        for (int i = 0; i < width; i++) {
            struct TreeNode* t = q[head++];
            level[i] = t->val;
            if (t->left) q[tail++] = t->left;
            if (t->right) q[tail++] = t->right;
        }
        out[*returnSize] = level;
        (*returnColumnSizes)[(*returnSize)++] = width;
    }
    return out;
}
