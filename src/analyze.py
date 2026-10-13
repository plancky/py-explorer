"""Runs inside Pyodide: turn Python source into tokens, an AST and bytecode.

All source ranges returned to JS are [start_line, start_col, end_line, end_col]
with 1-based lines and 0-based *character* columns (CodeMirror's convention).
`ast` and `dis` report UTF-8 *byte* columns, so those get converted.
A column of None means "the whole line".
"""

import ast
import dis
import io
import json
import keyword
import sys
import tokenize
import types
import warnings

VERSION = sys.version.split()[0]


class Source:
    def __init__(self, src):
        self.lines = src.split("\n")

    def char_col(self, line, byte_col):
        if line is None or byte_col is None or not (1 <= line <= len(self.lines)):
            return byte_col
        text = self.lines[line - 1]
        return len(text.encode("utf-8")[:byte_col].decode("utf-8", "ignore"))

    def byte_range(self, sl, sc, el, ec):
        if sl is None or sl < 1:  # RESUME etc. report line 0
            return None
        if el is None:
            el = sl
        return [sl, self.char_col(sl, sc), el, self.char_col(el, ec)]


# --- tokens -----------------------------------------------------------------

def token_kw(tok):
    if tok.type != tokenize.NAME:
        return None
    if keyword.iskeyword(tok.string):
        return "kw"
    if keyword.issoftkeyword(tok.string):
        return "soft"
    return None


def get_tokens(src):
    tokens, error = [], None
    try:
        for tok in tokenize.generate_tokens(io.StringIO(src).readline):
            tokens.append({
                "type": tokenize.tok_name[tok.type],
                "exact": tokenize.tok_name[tok.exact_type],
                "text": tok.string,
                "kw": token_kw(tok),
                "range": [tok.start[0], tok.start[1], tok.end[0], tok.end[1]],
            })
    except (tokenize.TokenError, SyntaxError) as e:
        error = e.args[0] if isinstance(e, tokenize.TokenError) else str(e)
    return tokens, error


# --- AST --------------------------------------------------------------------

def scalar_kind(v):
    if v is None or isinstance(v, bool) or v is Ellipsis:
        return "const"
    if isinstance(v, (int, float, complex)):
        return "num"
    if isinstance(v, (str, bytes)):
        return "str"
    return "other"


def ast_to_json(node, s):
    if isinstance(node, ast.AST):
        out = {
            "t": type(node).__name__,
            "f": [[name, ast_to_json(getattr(node, name, None), s)] for name in node._fields],
        }
        if getattr(node, "lineno", None) is not None:
            out["range"] = s.byte_range(node.lineno, node.col_offset,
                                        node.end_lineno, node.end_col_offset)
        return out
    if isinstance(node, list):
        return {"list": [ast_to_json(x, s) for x in node]}
    return {"v": repr(node), "k": scalar_kind(node)}


# --- bytecode -----------------------------------------------------------------

def const_repr(c):
    if isinstance(c, types.CodeType):
        return f"<code {c.co_qualname}>"
    r = repr(c)
    return r if len(r) <= 40 else r[:37] + "..."


def code_to_json(code, s, out):
    instrs = []
    for ins in dis.get_instructions(code):
        p = ins.positions
        rng = s.byte_range(p.lineno, p.col_offset, p.end_lineno, p.end_col_offset) if p else None
        instrs.append({
            "offset": ins.offset,
            "op": ins.opname,
            "arg": ins.arg,
            "argrepr": ins.argrepr,
            "line": ins.line_number if hasattr(ins, "line_number") else (p.lineno if p else None),
            "label": getattr(ins, "label", None),
            "target": ins.is_jump_target,
            "range": rng,
        })
    out.append({
        "name": code.co_qualname,
        "firstline": code.co_firstlineno,
        "argcount": code.co_argcount,
        "varnames": list(code.co_varnames),
        "cellvars": list(code.co_cellvars),
        "freevars": list(code.co_freevars),
        "names": list(code.co_names),
        "consts": [const_repr(c) for c in code.co_consts],
        "instrs": instrs,
    })
    for c in code.co_consts:
        if isinstance(c, types.CodeType):
            code_to_json(c, s, out)
    return out


# --- entry point --------------------------------------------------------------

def analyze(src):
    s = Source(src)
    result = {"version": VERSION, "warnings": []}
    result["tokens"], result["tokenError"] = get_tokens(src)
    try:
        with warnings.catch_warnings(record=True) as caught:
            warnings.simplefilter("always")
            tree = ast.parse(src, "<input>")
            code = compile(tree, "<input>", "exec")
        result["ast"] = ast_to_json(tree, s)
        result["bytecode"] = code_to_json(code, s, [])
        result["warnings"] = [f"line {w.lineno}: {w.message}" for w in caught]
    except SyntaxError as e:
        # SyntaxError offsets are already 1-based *character* columns.
        rng = None
        if e.lineno:
            sc = (e.offset or 1) - 1
            ec = (e.end_offset or 0) - 1
            el = e.end_lineno or e.lineno
            if el == e.lineno and ec <= sc:
                ec = sc + 1
            rng = [e.lineno, sc, el, ec]
        result["error"] = {"kind": type(e).__name__, "msg": e.msg, "range": rng}
    except Exception as e:  # e.g. null bytes, RecursionError on absurd nesting
        result["error"] = {"kind": type(e).__name__, "msg": str(e), "range": None}
    return json.dumps(result)


if __name__ == "__main__":
    sample = sys.argv[1] if len(sys.argv) > 1 else "x = 'é' + f(1)\n"
    print(json.dumps(json.loads(analyze(sample)), indent=1))
