/**
 * @param {string[]} strs
 * @return {string}
 */
var longestCommonPrefix = function(strs) {
    if (strs.length === 0) return "";
    let p = strs[0];
    for (const s of strs) {
        while (!s.startsWith(p)) p = p.slice(0, -1);
    }
    return p;
};
