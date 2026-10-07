class MyQueue:

    def __init__(self):
        self.inn, self.out = [], []

    def push(self, x: int) -> None:
        self.inn.append(x)

    def pop(self) -> int:
        self.peek()
        return self.out.pop()

    def peek(self) -> int:
        if not self.out:
            while self.inn:
                self.out.append(self.inn.pop())
        return self.out[-1]

    def empty(self) -> bool:
        return not self.inn and not self.out
