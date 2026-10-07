/**
 * @param {string} s
 * @return {boolean}
 */
var isPalindrome = function(s) {
    const t = s.toLowerCase().replace(/[^a-z0-9]/g, "");
    let i = 0, j = t.length - 1;
    while (i < j) if (t[i++] !== t[j--]) return false;
    return true;
};
