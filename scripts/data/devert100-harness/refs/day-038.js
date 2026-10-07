// Written as an ES class on purpose: proves the driver accepts `class` designs too.
class MyQueue {
    constructor() {
        this.inS = [];
        this.outS = [];
    }
    push(x) { this.inS.push(x); }
    move() { if (this.outS.length === 0) while (this.inS.length) this.outS.push(this.inS.pop()); }
    pop() { this.move(); return this.outS.pop(); }
    peek() { this.move(); return this.outS[this.outS.length - 1]; }
    empty() { return this.inS.length === 0 && this.outS.length === 0; }
}
