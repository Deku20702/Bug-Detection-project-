def severity_from_risk(score: float) -> str:
    if score >= 0.8:
        return "critical"
    if score >= 0.6:
        return "high"
    if score >= 0.35:
        return "medium"
    return "low"


def generate_recommendation(module: str, score: float, anti_patterns: list[str]) -> dict:
    severity = severity_from_risk(score)
    actions = [
        "Split responsibilities into smaller modules.",
        "Reduce direct dependencies with interfaces or adapters.",
        "Add module-level tests for risky dependency paths.",
    ]
    if any("Circular dependencies" in item for item in anti_patterns):
        actions.insert(0, "Break circular imports by introducing shared abstraction modules.")
    explanation = (
        f"Module `{module}` is classified as `{severity}` risk with score {score}. "
        "Risk is inferred from dependency centrality and anti-pattern signals."
    )
    return {
        "module": module,
        "severity": severity,
        "explanation": explanation,
        "actions": actions,
    }


def run_langgraph_reasoning(risks: dict[str, float], anti_patterns: list[str]) -> list[dict]:
    # Placeholder deterministic workflow that mirrors a LangGraph node pipeline.
    recommendations = [
        generate_recommendation(module, score, anti_patterns)
        for module, score in sorted(risks.items(), key=lambda item: item[1], reverse=True)
    ]
    return recommendations[:20]

