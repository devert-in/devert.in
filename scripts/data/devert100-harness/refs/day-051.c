/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     struct TreeNode *left;
 *     struct TreeNode *right;
 * };
 */

static int count(struct TreeNode* t) { return t ? 1 + count(t->left) + count(t->right) : 0; }

static void in(struct TreeNode* t, int* out, int* n) {
    if (!t) return;
    in(t->left, out, n); out[(*n)++] = t->val; in(t->right, out, n);
}
static void pre(struct TreeNode* t, int* out, int* n) {
    if (!t) return;
    out[(*n)++] = t->val; pre(t->left, out, n); pre(t->right, out, n);
}
static void post(struct TreeNode* t, int* out, int* n) {
    if (!t) return;
    post(t->left, out, n); post(t->right, out, n); out[(*n)++] = t->val;
}

/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* inorderTraversal(struct TreeNode* root, int* returnSize) {
    int* out = malloc((count(root) + 1) * sizeof(int));
    *returnSize = 0;
    in(root, out, returnSize);
    return out;
}

/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* preorderTraversal(struct TreeNode* root, int* returnSize) {
    int* out = malloc((count(root) + 1) * sizeof(int));
    *returnSize = 0;
    pre(root, out, returnSize);
    return out;
}

/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* postorderTraversal(struct TreeNode* root, int* returnSize) {
    int* out = malloc((count(root) + 1) * sizeof(int));
    *returnSize = 0;
    post(root, out, returnSize);
    return out;
}
