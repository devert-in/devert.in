class Solution:
    def levelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:
        res, q = [], deque([root] if root else [])
        while q:
            res.append([])
            for _ in range(len(q)):
                t = q.popleft()
                res[-1].append(t.val)
                if t.left: q.append(t.left)
                if t.right: q.append(t.right)
        return res
