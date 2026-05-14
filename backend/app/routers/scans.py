from datetime import datetime, timezone
from pathlib import Path

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import mongo_db, neo4j_driver
from app.deps import get_current_user_email
from app.schemas import ScanStartRequest
from app.services.analyzer import build_dependency_graph, detect_anti_patterns
from app.services.features import extract_features
from app.services.ml import predict_module_risks, get_model_info
from app.services.repo_fetch import prepare_repo_path
from app.services.reasoning import run_langgraph_reasoning

router = APIRouter()


def _id_filter(raw_id: str) -> dict:
    try:
        return {"_id": ObjectId(raw_id)}
    except Exception:
        return {"_id": raw_id}


def _persist_graph(project_id: str, edges: list[tuple[str, str]]) -> None:
    with neo4j_driver.session() as session:
        for source, target in edges:
            session.run(
                """
                MERGE (s:Module {name: $source, project_id: $project_id})
                MERGE (t:Module {name: $target, project_id: $project_id})
                MERGE (s)-[:DEPENDS_ON]->(t)
                """,
                source=source,
                target=target,
                project_id=project_id,
            )


@router.post("/start")
def start_scan(payload: ScanStartRequest, email: str = Depends(get_current_user_email)) -> dict:
    project_query = _id_filter(payload.project_id)
    project_query["owner_email"] = email
    project = mongo_db["projects"].find_one(project_query)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    repo_url = project["repo_url"]
    try:
        repo_path, _is_temp = prepare_repo_path(repo_url)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    graph, analyzer_stats = build_dependency_graph(repo_path)
    anti_patterns = detect_anti_patterns(graph)

    # Pass repo_path so AST features (LOC, CC, etc.) are computed from real files
    features = extract_features(graph, repo_path=repo_path)

    # XGBoost model predicts defect probability per module
    risks = predict_module_risks(features)

    recommendations = run_langgraph_reasoning(risks, anti_patterns)

    # Inject code evidence into recommendations
    for rec in recommendations:
        module_name = rec.get("module")
        evidence_list = []
        if module_name and graph.has_node(module_name):
            for _, target, edge_data in graph.out_edges(module_name, data=True):
                if "evidence" in edge_data:
                    evidence_list.extend(edge_data["evidence"])
            in_count = 0
            for source, _, edge_data in graph.in_edges(module_name, data=True):
                if "evidence" in edge_data and in_count < 3:
                    evidence_list.extend(edge_data["evidence"])
                    in_count += 1
            unique_evidence = {(e["line"], e["code"]): e for e in evidence_list}.values()
            evidence_list = sorted(list(unique_evidence), key=lambda x: x.get("line", 0))
        rec["evidence"] = evidence_list

    edges = list(graph.edges())
    _persist_graph(payload.project_id, edges)

    # Store which model was used
    model_meta = get_model_info()

    scan_doc = {
        "project_id": payload.project_id,
        "owner_email": email,
        "status": "completed",
        "anti_patterns": anti_patterns,
        "analyzer_stats": analyzer_stats,
        "risks": risks,
        "features": features,
        "recommendations": recommendations,
        "graph": {"nodes": list(graph.nodes()), "edges": edges},
        "model_info": model_meta,
        "created_at": datetime.now(timezone.utc),
    }
    scan_id = str(mongo_db["scans"].insert_one(scan_doc).inserted_id)
    return {"scan_id": scan_id, "status": "completed", "model": model_meta["name"]}


@router.get("/{scan_id}/status")
def scan_status(scan_id: str, email: str = Depends(get_current_user_email)) -> dict:
    scan_query = _id_filter(scan_id)
    scan_query["owner_email"] = email
    scan = mongo_db["scans"].find_one(scan_query)
    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")
    return {"scan_id": scan_id, "status": scan["status"]}


@router.get("/{scan_id}/summary")
def scan_summary(scan_id: str, email: str = Depends(get_current_user_email)) -> dict:
    scan_query = _id_filter(scan_id)
    scan_query["owner_email"] = email
    scan = mongo_db["scans"].find_one(scan_query)
    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")
    return {
        "scan_id": scan_id,
        "project_id": scan["project_id"],
        "status": scan["status"],
        "analyzer_stats": scan.get("analyzer_stats", {}),
        "module_count": len(scan.get("graph", {}).get("nodes", [])),
        "edge_count": len(scan.get("graph", {}).get("edges", [])),
        "high_risk_modules": len([v for v in scan["risks"].values() if v >= 0.6]),
        "risks": scan["risks"],
        "anti_patterns": scan["anti_patterns"],
        "model_info": scan.get("model_info", {}),
    }


@router.get("/{scan_id}/modules")
def scan_modules(scan_id: str, email: str = Depends(get_current_user_email)) -> list[dict]:
    scan_query = _id_filter(scan_id)
    scan_query["owner_email"] = email
    scan = mongo_db["scans"].find_one(scan_query)
    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")
    risks = scan["risks"]
    rows = []
    for feature in scan["features"]:
        module = feature["module"]
        rows.append({"module": module, "risk": risks.get(module, 0), "features": feature})
    return sorted(rows, key=lambda row: row["risk"], reverse=True)


@router.get("/{scan_id}/graph")
def scan_graph(scan_id: str, email: str = Depends(get_current_user_email)) -> dict:
    scan_query = _id_filter(scan_id)
    scan_query["owner_email"] = email
    scan = mongo_db["scans"].find_one(scan_query)
    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")
    return scan["graph"]


@router.get("/{scan_id}/recommendations")
def scan_recommendations(scan_id: str, email: str = Depends(get_current_user_email)) -> list[dict]:
    scan_query = _id_filter(scan_id)
    scan_query["owner_email"] = email
    scan = mongo_db["scans"].find_one(scan_query)
    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")
    return scan["recommendations"]


@router.get("/model-info")
def model_info(email: str = Depends(get_current_user_email)) -> dict:
    """Return info about the currently active ML model."""
    return get_model_info()
