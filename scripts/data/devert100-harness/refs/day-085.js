/**
 * @param {number[]} arr
 * @return {number}
 */
var minCost = function(arr) {
    // Min-heap of rope lengths; always join the two shortest.
    const h = [];
    const up = (i) => { while (i > 0) { const p = (i - 1) >> 1; if (h[p] <= h[i]) break; [h[p], h[i]] = [h[i], h[p]]; i = p; } };
    const down = (i) => {
        for (;;) {
            const l = 2 * i + 1, r = l + 1;
            let m = i;
            if (l < h.length && h[l] < h[m]) m = l;
            if (r < h.length && h[r] < h[m]) m = r;
            if (m === i) return;
            [h[m], h[i]] = [h[i], h[m]]; i = m;
        }
    };
    const pop = () => { const top = h[0]; const last = h.pop(); if (h.length) { h[0] = last; down(0); } return top; };
    for (const x of arr) { h.push(x); up(h.length - 1); }
    let cost = 0;
    while (h.length > 1) {
        const s = pop() + pop();
        cost += s;
        h.push(s); up(h.length - 1);
    }
    return cost;
};
