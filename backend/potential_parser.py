"""Safe math expression evaluator for user-supplied potential strings.

Uses asteval with a restricted symbol table — never eval() or exec().
"""

import numpy as np
from asteval import Interpreter


ALLOWED_SYMBOLS = {
    "x":    None,          # replaced with the grid array at call time
    "np":   np,
    "sin":  np.sin,
    "cos":  np.cos,
    "exp":  np.exp,
    "abs":  np.abs,
    "sqrt": np.sqrt,
    "pi":   np.pi,
    "inf":  np.inf,
}


def parse_potential(expression: str, x: np.ndarray) -> np.ndarray:
    """Evaluate *expression* over grid *x* and return V(x) as an ndarray.

    The expression may reference 'x' and the math symbols listed in
    ALLOWED_SYMBOLS.  No other names are available — this prevents
    arbitrary code execution.

    Raises
    ------
    ValueError
        If the expression cannot be parsed, produces an error, or returns
        a result that is not array-like with the same shape as *x*.
    """
    symbols = dict(ALLOWED_SYMBOLS)
    symbols["x"] = x

    aeval = Interpreter(usersyms=symbols, no_print=True)
    # Disable builtins so user cannot access import, open, etc.
    aeval.symtable.update({"__builtins__": {}})

    result = aeval(expression)

    if aeval.error:
        messages = "; ".join(str(e.get_error()) for e in aeval.error)
        raise ValueError(f"Invalid potential expression: {messages}")

    if result is None:
        raise ValueError("Potential expression returned no value.")

    try:
        arr = np.asarray(result, dtype=float)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Potential expression did not return numeric data: {exc}") from exc

    # Broadcast scalar to full grid
    if arr.ndim == 0:
        arr = np.full_like(x, float(arr))

    if arr.shape != x.shape:
        raise ValueError(
            f"Potential expression returned shape {arr.shape}, expected {x.shape}."
        )

    return arr
