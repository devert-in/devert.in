class MyQueue {
    stack<int> in, out;
    void shift() {
        if (out.empty()) while (!in.empty()) { out.push(in.top()); in.pop(); }
    }
public:
    MyQueue() {
    }

    void push(int x) {
        in.push(x);
    }

    int pop() {
        shift();
        int v = out.top();
        out.pop();
        return v;
    }

    int peek() {
        shift();
        return out.top();
    }

    bool empty() {
        return in.empty() && out.empty();
    }
};
