/**
 * @param {number[]} arr
 * @param {number} k
 * @return {void} Do not return anything, modify arr in-place instead.
 */
var nearlySorted = function(arr, k) {
    // Insertion sort: each element moves at most k places, so O(n*k).
    for (let i = 1; i < arr.length; i++) {
        const v = arr[i];
        let j = i - 1;
        while (j >= 0 && arr[j] > v) { arr[j + 1] = arr[j]; j--; }
        arr[j + 1] = v;
    }
};
