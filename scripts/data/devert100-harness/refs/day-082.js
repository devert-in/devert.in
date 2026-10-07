/**
 * @param {number[]} val
 * @param {number[]} wt
 * @param {number} capacity
 * @return {number}
 */
var fractionalKnapsack = function(val, wt, capacity) {
    const items = val.map((v, i) => [v, wt[i]]).sort((a, b) => b[0] / b[1] - a[0] / a[1]);
    let left = capacity, total = 0;
    for (const [v, w] of items) {
        if (left <= 0) break;
        const take = Math.min(w, left);
        total += v * take / w;
        left -= take;
    }
    return total;
};
