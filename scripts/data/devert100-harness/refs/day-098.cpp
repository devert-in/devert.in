class LRUCache {
    struct Node { int key, val; };
    int cap;
    list<Node> order;
    unordered_map<int, list<Node>::iterator> pos;
public:
    LRUCache(int capacity) : cap(capacity) {
    }

    int get(int key) {
        auto it = pos.find(key);
        if (it == pos.end()) return -1;
        order.splice(order.begin(), order, it->second);
        return it->second->val;
    }

    void put(int key, int value) {
        auto it = pos.find(key);
        if (it != pos.end()) {
            it->second->val = value;
            order.splice(order.begin(), order, it->second);
            return;
        }
        if ((int)order.size() == cap) {
            pos.erase(order.back().key);
            order.pop_back();
        }
        order.push_front({key, value});
        pos[key] = order.begin();
    }
};
