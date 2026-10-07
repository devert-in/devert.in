class Solution {
    void in(TreeNode* t, vector<int>& out) { if (!t) return; in(t->left, out); out.push_back(t->val); in(t->right, out); }
    void pre(TreeNode* t, vector<int>& out) { if (!t) return; out.push_back(t->val); pre(t->left, out); pre(t->right, out); }
    void post(TreeNode* t, vector<int>& out) { if (!t) return; post(t->left, out); post(t->right, out); out.push_back(t->val); }
public:
    vector<int> inorderTraversal(TreeNode* root) {
        vector<int> out; in(root, out); return out;
    }

    vector<int> preorderTraversal(TreeNode* root) {
        vector<int> out; pre(root, out); return out;
    }

    vector<int> postorderTraversal(TreeNode* root) {
        vector<int> out; post(root, out); return out;
    }
};
