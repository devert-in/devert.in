class Solution:
    def longestPalindrome(self, s: str) -> str:
        best = ""
        for c in range(len(s)):
            for l, r in ((c, c), (c, c + 1)):
                while l >= 0 and r < len(s) and s[l] == s[r]:
                    l -= 1
                    r += 1
                if r - l - 1 > len(best):
                    best = s[l + 1:r]
        return best
