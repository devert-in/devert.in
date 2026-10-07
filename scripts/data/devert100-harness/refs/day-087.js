/**
 * @param {number} N
 * @return {number[]}
 */
var minPartition = function(N) {
    const coins = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1];
    const out = [];
    for (const c of coins) while (N >= c) { out.push(c); N -= c; }
    return out;
};
