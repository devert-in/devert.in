/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {number[]}
 */
var inorderTraversal = function(root) {
    const out = [];
    const go = (n) => { if (!n) return; go(n.left); out.push(n.val); go(n.right); };
    go(root);
    return out;
};

/**
 * @param {TreeNode} root
 * @return {number[]}
 */
var preorderTraversal = function(root) {
    const out = [];
    const go = (n) => { if (!n) return; out.push(n.val); go(n.left); go(n.right); };
    go(root);
    return out;
};

/**
 * @param {TreeNode} root
 * @return {number[]}
 */
var postorderTraversal = function(root) {
    const out = [];
    const go = (n) => { if (!n) return; go(n.left); go(n.right); out.push(n.val); };
    go(root);
    return out;
};
