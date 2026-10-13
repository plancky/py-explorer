export const EXAMPLES = {
  "Expression": "x = 1 + 2 * (3 - y)\n",
  "if / while": "n = 10\nwhile n > 0:\n    if n % 2 == 0:\n        print(n, \"even\")\n    else:\n        print(n)\n    n -= 1\n",
  "Function + closure": "def make_counter(start=0):\n    count = start\n\n    def inc(step=1):\n        nonlocal count\n        count += step\n        return count\n\n    return inc\n\nc = make_counter()\nc()\n",
  "Class": "class Point:\n    \"\"\"A 2D point.\"\"\"\n\n    def __init__(self, x, y):\n        self.x = x\n        self.y = y\n\n    def __add__(self, other):\n        return Point(self.x + other.x, self.y + other.y)\n",
  "Comprehensions": "squares = [x * x for x in range(10) if x % 2]\nlookup = {k: v for k, v in zip(\"abc\", squares)}\ntotal = sum(x for x in squares)\n",
  "f-string": "name = \"world\"\nwidth = 12\nmsg = f\"hello {name!r:>{width}} = {1 + 1}\"\n",
  "match / case": "def describe(cmd):\n    match cmd.split():\n        case [\"go\", direction]:\n            return f\"going {direction}\"\n        case [\"quit\" | \"exit\"]:\n            return \"bye\"\n        case _:\n            return \"unknown\"\n",
  "try / with": "try:\n    with open(\"data.txt\") as f:\n        data = f.read()\nexcept FileNotFoundError as e:\n    data = None\nfinally:\n    print(\"done\")\n",
  "Syntax error": "def f(x:\n    return x\n",
};
