class Solution:
    def inorderTraversal(self, root: Optional[TreeNode]) -> List[int]:
        return self.inorderTraversal(root.left) + [root.val] + self.inorderTraversal(root.right) if root else []

    def preorderTraversal(self, root: Optional[TreeNode]) -> List[int]:
        out, st = [], [root]
        while st:
            t = st.pop()
            if t:
                out.append(t.val)
                st.append(t.right)
                st.append(t.left)
        return out

    def postorderTraversal(self, root: Optional[TreeNode]) -> List[int]:
        if not root:
            return []
        return self.postorderTraversal(root.left) + self.postorderTraversal(root.right) + [root.val]
