// A learner-defined Node class (the usual LRU doubly-linked list) on purpose:
// the driver must not collide with a learner's own helper class names.
class Node {
    constructor(key, val) { this.key = key; this.val = val; this.prev = null; this.next = null; }
}

/**
 * @param {number} capacity
 */
var LRUCache = function(capacity) {
    this.cap = capacity;
    this.map = new Map();
    this.head = new Node(0, 0);
    this.tail = new Node(0, 0);
    this.head.next = this.tail;
    this.tail.prev = this.head;
};

LRUCache.prototype.unlink = function(n) { n.prev.next = n.next; n.next.prev = n.prev; };
LRUCache.prototype.front = function(n) {
    n.next = this.head.next; n.prev = this.head;
    this.head.next.prev = n; this.head.next = n;
};

/**
 * @param {number} key
 * @return {number}
 */
LRUCache.prototype.get = function(key) {
    const n = this.map.get(key);
    if (!n) return -1;
    this.unlink(n); this.front(n);
    return n.val;
};

/**
 * @param {number} key
 * @param {number} value
 * @return {void}
 */
LRUCache.prototype.put = function(key, value) {
    let n = this.map.get(key);
    if (n) { n.val = value; this.unlink(n); this.front(n); return; }
    if (this.map.size === this.cap) {
        const lru = this.tail.prev;
        this.unlink(lru);
        this.map.delete(lru.key);
    }
    n = new Node(key, value);
    this.map.set(key, n);
    this.front(n);
};
