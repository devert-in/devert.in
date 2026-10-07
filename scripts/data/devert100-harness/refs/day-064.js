/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode[]} lists
 * @return {ListNode}
 */
var mergeKLists = function(lists) {
    const two = (a, b) => {
        const dummy = new ListNode(0);
        let t = dummy;
        while (a && b) {
            if (a.val <= b.val) { t.next = a; a = a.next; } else { t.next = b; b = b.next; }
            t = t.next;
        }
        t.next = a ? a : b;
        return dummy.next;
    };
    if (lists.length === 0) return null;
    let step = 1;
    while (step < lists.length) {
        for (let i = 0; i + step < lists.length; i += 2 * step) lists[i] = two(lists[i], lists[i + step]);
        step *= 2;
    }
    return lists[0];
};
