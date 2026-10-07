/**
 * // Definition for a _Node.
 * function _Node(val, neighbors) {
 *    this.val = val === undefined ? 0 : val;
 *    this.neighbors = neighbors === undefined ? [] : neighbors;
 * };
 */

/**
 * @param {_Node} node
 * @return {_Node}
 */
var cloneGraph = function(node) {
    if (node === null) return null;
    const copies = new Map();
    const clone = (n) => {
        if (copies.has(n)) return copies.get(n);
        const c = new _Node(n.val);
        copies.set(n, c);
        for (const x of n.neighbors) c.neighbors.push(clone(x));
        return c;
    };
    return clone(node);
};
