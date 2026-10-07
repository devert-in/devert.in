/**
 * @param {number} numCourses
 * @param {number[][]} prerequisites
 * @return {number[]}
 */
var findOrder = function(numCourses, prerequisites) {
    const adj = Array.from({ length: numCourses }, () => []);
    const indeg = new Array(numCourses).fill(0);
    for (const [a, b] of prerequisites) { adj[b].push(a); indeg[a]++; }
    const q = [];
    for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) q.push(i);
    for (let h = 0; h < q.length; h++) {
        for (const v of adj[q[h]]) if (--indeg[v] === 0) q.push(v);
    }
    return q.length === numCourses ? q : [];
};
