class Solution {
public:
    vector<vector<int>> kClosest(vector<vector<int>>& points, int k) {
        auto d = [](const vector<int>& p) { return (long long)p[0] * p[0] + (long long)p[1] * p[1]; };
        priority_queue<pair<long long, int>> heap;
        for (int i = 0; i < (int)points.size(); i++) {
            heap.push({d(points[i]), i});
            if ((int)heap.size() > k) heap.pop();
        }
        vector<vector<int>> out;
        while (!heap.empty()) { out.push_back(points[heap.top().second]); heap.pop(); }
        return out;
    }
};
