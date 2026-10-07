class Solution {
public:
    int compress(vector<char>& chars) {
        int w = 0, n = chars.size();
        for (int i = 0; i < n;) {
            int j = i;
            while (j < n && chars[j] == chars[i]) j++;
            chars[w++] = chars[i];
            if (j - i > 1) for (char c : to_string(j - i)) chars[w++] = c;
            i = j;
        }
        return w;
    }
};
