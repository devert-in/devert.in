
var MedianFinder = function() {
    this.a = [];
};

/**
 * @param {number} num
 * @return {void}
 */
MedianFinder.prototype.addNum = function(num) {
    let lo = 0, hi = this.a.length;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (this.a[mid] < num) lo = mid + 1; else hi = mid;
    }
    this.a.splice(lo, 0, num);
};

/**
 * @return {number}
 */
MedianFinder.prototype.findMedian = function() {
    const n = this.a.length;
    return n % 2 ? this.a[(n - 1) / 2] : (this.a[n / 2 - 1] + this.a[n / 2]) / 2;
};
