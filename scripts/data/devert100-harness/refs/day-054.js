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
 * @return {number[][]}
 */
var levelOrder = function(root) {
    const out = [];
    let level = root ? [root] : [];
    while (level.length) {
        out.push(level.map(n => n.val));
        const next = [];
        for (const n of level) { if (n.left) next.push(n.left); if (n.right) next.push(n.right); }
        level = next;
    }
    return out;
};
