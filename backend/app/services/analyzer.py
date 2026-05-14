import ast
from pathlib import Path

import networkx as nx


def parse_python_imports(file_path: Path) -> tuple[list[dict], bool]:
    """
    Parses a Python file to find imports.
    Returns a list of dicts with the imported module, line number, and code snippet.
    """
    content = file_path.read_text(encoding="utf-8", errors="ignore")
    lines = content.splitlines()  # Split into array to grab exact lines by index
    
    try:
        tree = ast.parse(content)
    except SyntaxError:
        # Skip non-parseable files (e.g. Python2 code) without failing full scan.
        return [], False
        
    imports = []
    
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for name in node.names:
                imported_module = name.name.split(".")[0]
                line_num = getattr(node, 'lineno', 1)
                # Arrays are 0-indexed, AST lineno is 1-indexed
                code_snippet = lines[line_num - 1].strip() if line_num <= len(lines) else ""
                
                imports.append({
                    "module": imported_module,
                    "line": line_num,
                    "code": code_snippet
                })
                
        elif isinstance(node, ast.ImportFrom) and node.module:
            imported_module = node.module.split(".")[0]
            line_num = getattr(node, 'lineno', 1)
            code_snippet = lines[line_num - 1].strip() if line_num <= len(lines) else ""
            
            imports.append({
                "module": imported_module,
                "line": line_num,
                "code": code_snippet
            })
            
    return imports, True


def build_dependency_graph(repo_path: Path) -> tuple[nx.DiGraph, dict[str, int]]:
    graph = nx.DiGraph()
    modules: dict[str, Path] = {}
    parseable_files = 0
    skipped_files = 0
    
    # 1. Register all valid Python modules as nodes
    for py_file in repo_path.rglob("*.py"):
        rel = py_file.relative_to(repo_path).as_posix().replace("/", ".")
        module_name = rel.removesuffix(".py")
        modules[module_name] = py_file
        graph.add_node(module_name)

    # 2. Build edges and attach code evidence
    for module, file_path in modules.items():
        imports_data, ok = parse_python_imports(file_path)
        if ok:
            parseable_files += 1
        else:
            skipped_files += 1
            
        for imp in imports_data:
            imported_name = imp["module"]
            # Find matching local modules
            matches = [m for m in modules if m.endswith(imported_name) or m == imported_name]
            
            for target in matches:
                if target != module:
                    # If edge already exists, append the new evidence (multiple imports in same file)
                    if graph.has_edge(module, target):
                        graph[module][target].setdefault('evidence', []).append({
                            "line": imp["line"],
                            "code": imp["code"]
                        })
                    else:
                        # Create new edge with the code evidence attached!
                        graph.add_edge(module, target, evidence=[{
                            "line": imp["line"],
                            "code": imp["code"]
                        }])
                        
    stats = {
        "total_python_files": len(modules),
        "parseable_python_files": parseable_files,
        "skipped_python_files": skipped_files,
    }
    return graph, stats


def detect_anti_patterns(graph: nx.DiGraph) -> list[str]:
    issues: list[str] = []
    cycles = list(nx.simple_cycles(graph))
    if cycles:
        issues.append(f"Circular dependencies detected: {len(cycles)} cycle(s)")
    high_out_degree = [n for n, d in graph.out_degree() if d >= 8]
    if high_out_degree:
        issues.append(f"Tight coupling hotspot modules: {', '.join(high_out_degree[:5])}")
    high_in_degree = [n for n, d in graph.in_degree() if d >= 8]
    if high_in_degree:
        issues.append(f"God-like utility modules (high fan-in): {', '.join(high_in_degree[:5])}")
    if not issues:
        issues.append("No major anti-patterns detected with current heuristics.")
    return issues