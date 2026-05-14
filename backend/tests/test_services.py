import networkx as nx

from app.services.analyzer import detect_anti_patterns
from app.services.features import extract_features
from app.services.ml import predict_module_risks
from app.services.reasoning import run_langgraph_reasoning


def test_feature_and_prediction_pipeline() -> None:
    graph = nx.DiGraph()
    graph.add_edge("a", "b")
    graph.add_edge("b", "c")
    graph.add_edge("c", "a")
    graph.add_edge("a", "d")
    features = extract_features(graph)
    risks = predict_module_risks(features)
    assert len(features) == 4
    assert len(risks) == 4


def test_anti_pattern_and_reasoning() -> None:
    graph = nx.DiGraph()
    graph.add_edge("one", "two")
    graph.add_edge("two", "one")
    anti_patterns = detect_anti_patterns(graph)
    recommendations = run_langgraph_reasoning({"one": 0.9, "two": 0.4}, anti_patterns)
    assert anti_patterns
    assert recommendations[0]["severity"] in {"critical", "high", "medium", "low"}
