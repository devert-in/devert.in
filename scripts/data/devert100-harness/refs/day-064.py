class Solution:
    def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:
        h = [(l.val, i, l) for i, l in enumerate(lists) if l]
        heapify(h)
        dummy = tail = ListNode()
        while h:
            v, i, node = heappop(h)
            tail.next = node
            tail = node
            if node.next:
                heappush(h, (node.next.val, i, node.next))
        return dummy.next
