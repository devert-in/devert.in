/**
 * @param {string} s
 * @return {string}
 */
var longestPalindrome = function(s) {
    let best = [0, 0];
    const grow = (l, r) => {
        while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; }
        if (r - l - 1 > best[1] - best[0]) best = [l + 1, r];
    };
    for (let i = 0; i < s.length; i++) { grow(i, i); grow(i, i + 1); }
    return s.slice(best[0], best[1]);
};
