class Solution {
public:
    string longestPalindrome(string s) {
        int best = 0, start = 0, n = s.size();
        for (int c = 0; c < n; c++) {
            for (int odd = 0; odd < 2; odd++) {
                int l = c, r = c + odd;
                while (l >= 0 && r < n && s[l] == s[r]) { l--; r++; }
                if (r - l - 1 > best) { best = r - l - 1; start = l + 1; }
            }
        }
        return s.substr(start, best);
    }
};
