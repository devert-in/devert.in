/**
 * @param {character[]} chars
 * @return {number}
 */
var compress = function(chars) {
    let w = 0, i = 0;
    while (i < chars.length) {
        const c = chars[i];
        let j = i;
        while (j < chars.length && chars[j] === c) j++;
        chars[w++] = c;
        const run = j - i;
        if (run > 1) for (const d of String(run)) chars[w++] = d;
        i = j;
    }
    return w;
};
