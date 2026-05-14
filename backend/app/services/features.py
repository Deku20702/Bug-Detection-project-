"""
Feature extraction for the XGBoost defect-prediction model.

XGBoost model expects exactly these 11 features (in order):
  lines_of_code, cyclomatic_complexity, num_functions, num_classes,
  comment_density, code_churn, num_developers, commit_frequency,
  avg_function_length, bug_fix_commits, past_defects

Most are computed from AST analysis of each Python file.
Graph-level metrics (betweenness, cycle_count) are also stored as
module metadata so the reasoning layer can still use them.
"""
from __future__ import annotations

import ast
import math
from dataclasses import asdict, dataclass
from pathlib import Path

import networkx as nx


# ---------------------------------------------------------------------------
# AST helpers
# ---------------------------------------------------------------------------

def _count_cyclomatic(tree: ast.AST) -> int:
    """
    McCabe complexity = 1 + number of branching nodes in AST.
    Counts: If, For, While, ExceptHandler, With, Assert, comprehensions,
            BoolOp (and/or), ternary IfExp.
    """
    branch_nodes = (
        ast.If, ast.For, ast.While, ast.ExceptHandler,
        ast.With, ast.Assert, ast.IfExp,
        ast.ListComp, ast.SetComp, ast.DictComp, ast.GeneratorExp,
        ast.BoolOp,
    )
    return 1 + sum(1 for _ in ast.walk(tree) if isinstance(_, branch_nodes))


def _analyse_file(file_path: Path) -> dict:
    """Return AST-derived metrics for one Python file."""
    try:
        source = file_path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return _zero_metrics()

    lines = source.splitlines()
    loc = len(lines)

    try:
        tree = ast.parse(source)
    except SyntaxError:
        # Still return LOC for unparseable files
        return {**_zero_metrics(), "lines_of_code": loc}

    # Count top-level + nested functions and classes
    functions = [n for n in ast.walk(tree) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]
    classes   = [n for n in ast.walk(tree) if isinstance(n, ast.ClassDef)]

    # Average function length (body lines)
    fn_lengths = []
    for fn in functions:
        end = getattr(fn, "end_lineno", None) or fn.lineno
        fn_lengths.append(max(1, end - fn.lineno))
    avg_fn_len = round(sum(fn_lengths) / len(fn_lengths), 2) if fn_lengths else 0.0

    # Comment density = comment lines / total lines
    comment_lines = sum(1 for ln in lines if ln.strip().startswith("#"))
    comment_density = round(comment_lines / max(loc, 1), 4)

    return {
        "lines_of_code":        loc,
        "cyclomatic_complexity": _count_cyclomatic(tree),
        "num_functions":         len(functions),
        "num_classes":           len(classes),
        "comment_density":       comment_density,
        "avg_function_length":   avg_fn_len,
    }


def _zero_metrics() -> dict:
    return {
        "lines_of_code":         0,
        "cyclomatic_complexity":  1,
        "num_functions":          0,
        "num_classes":            0,
        "comment_density":        0.0,
        "avg_function_length":    0.0,
    }


# ---------------------------------------------------------------------------
# Graph-level helpers
# ---------------------------------------------------------------------------

def _cycle_count(graph: nx.DiGraph, node: str) -> int:
    count = 0
    try:
        for cycle in nx.simple_cycles(graph):
            if node in cycle:
                count += 1
    except Exception:
        pass
    return count


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

@dataclass
class ModuleFeatures:
    module: str

    # ── AST features (map directly to model columns) ──────────────────────
    lines_of_code:         int
    cyclomatic_complexity: float
    num_functions:         int
    num_classes:           int
    comment_density:       float
    avg_function_length:   float

    # ── Proxy / heuristic features (model columns) ────────────────────────
    # These are approximated from graph topology since we don't have
    # real git history; the approximations are consistent and reproducible.
    code_churn:       int    # proxy: LOC × out_degree (more deps → more change surface)
    num_developers:   int    # proxy: betweenness bucket (central modules → many contributors)
    commit_frequency: float  # proxy: (in_degree + out_degree) / 4
    bug_fix_commits:  int    # proxy: cycle_count * 2 (cycles → more bug-fix activity)
    past_defects:     int    # proxy: cycle_count + (1 if cyclomatic > 10 else 0)

    # ── Extra graph metadata (not model input, used by reasoning) ─────────
    in_degree:    int
    out_degree:   int
    betweenness:  float
    cycle_count:  int
    loc_proxy:    int   # kept for backward-compat with old reasoning layer


def extract_features(graph: nx.DiGraph, repo_path: Path | None = None) -> list[dict]:
    """
    Extract 11-feature vectors for every node in *graph*.

    If *repo_path* is provided, AST metrics are computed from the actual
    source files.  Otherwise pure-graph proxies are used for all columns.
    """
    betweenness: dict[str, float] = (
        nx.betweenness_centrality(graph) if graph.number_of_nodes() else {}
    )

    # Pre-compute all cycles once (expensive for large graphs)
    cycle_map: dict[str, int] = {n: 0 for n in graph.nodes}
    try:
        for cycle in nx.simple_cycles(graph):
            for node in cycle:
                cycle_map[node] = cycle_map.get(node, 0) + 1
    except Exception:
        pass

    # Build module-name → file-path index
    file_index: dict[str, Path] = {}
    if repo_path is not None:
        for py_file in repo_path.rglob("*.py"):
            rel = py_file.relative_to(repo_path).as_posix().replace("/", ".")
            mod_name = rel.removesuffix(".py")
            file_index[mod_name] = py_file

    features: list[dict] = []

    for node in graph.nodes:
        in_deg  = graph.in_degree(node)
        out_deg = graph.out_degree(node)
        btwn    = round(betweenness.get(node, 0.0), 6)
        cycles  = cycle_map.get(node, 0)

        # AST analysis (if file available) or zero-fill
        file_path = file_index.get(node)
        if file_path and file_path.exists():
            ast_metrics = _analyse_file(file_path)
        else:
            # Pure-graph proxies for AST columns
            est_loc = max(20, (in_deg + out_deg) * 12)
            ast_metrics = {
                "lines_of_code":         est_loc,
                "cyclomatic_complexity":  1 + out_deg,
                "num_functions":          max(1, out_deg),
                "num_classes":            max(0, in_deg // 3),
                "comment_density":        0.05,
                "avg_function_length":    max(5.0, est_loc / max(1, out_deg)),
            }

        loc        = ast_metrics["lines_of_code"]
        cc         = ast_metrics["cyclomatic_complexity"]
        num_fn     = ast_metrics["num_functions"]
        num_cls    = ast_metrics["num_classes"]
        com_den    = ast_metrics["comment_density"]
        avg_fn_len = ast_metrics["avg_function_length"]

        # Heuristic proxies for git-history features
        code_churn       = max(0, loc + out_deg * 8)
        num_devs         = max(1, math.ceil(btwn * 10) + (1 if in_deg > 3 else 0))
        commit_freq      = round((in_deg + out_deg) / 4.0, 2)
        bug_fix_commits  = cycles * 2 + (1 if cc > 10 else 0)
        past_defects     = cycles + (1 if cc > 10 else 0)

        row = ModuleFeatures(
            module=node,
            lines_of_code=int(loc),
            cyclomatic_complexity=float(cc),
            num_functions=int(num_fn),
            num_classes=int(num_cls),
            comment_density=float(com_den),
            avg_function_length=float(avg_fn_len),
            code_churn=int(code_churn),
            num_developers=int(num_devs),
            commit_frequency=float(commit_freq),
            bug_fix_commits=int(bug_fix_commits),
            past_defects=int(past_defects),
            # graph metadata
            in_degree=int(in_deg),
            out_degree=int(out_deg),
            betweenness=btwn,
            cycle_count=int(cycles),
            loc_proxy=max(20, (in_deg + out_deg) * 12),
        )
        features.append(asdict(row))

    return features
