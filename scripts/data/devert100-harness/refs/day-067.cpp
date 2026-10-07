class Solution {
    unordered_map<Node*, Node*> copies;
public:
    Node* cloneGraph(Node* node) {
        if (!node) return nullptr;
        auto it = copies.find(node);
        if (it != copies.end()) return it->second;
        Node* c = new Node(node->val);
        copies[node] = c;
        for (Node* x : node->neighbors) c->neighbors.push_back(cloneGraph(x));
        return c;
    }
};
