class Solution {
public:
    string longestCommonPrefix(vector<string>& strs) {
        if (strs.empty()) return "";
        string p = strs[0];
        for (const string& s : strs) {
            size_t i = 0;
            while (i < p.size() && i < s.size() && p[i] == s[i]) i++;
            p = p.substr(0, i);
        }
        return p;
    }
};
