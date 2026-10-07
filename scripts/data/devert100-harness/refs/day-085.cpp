class Solution {
public:
    long long minCost(vector<int>& arr) {
        priority_queue<long long, vector<long long>, greater<long long>> pq(arr.begin(), arr.end());
        long long total = 0;
        while (pq.size() > 1) {
            long long a = pq.top(); pq.pop();
            long long b = pq.top(); pq.pop();
            total += a + b;
            pq.push(a + b);
        }
        return total;
    }
};
