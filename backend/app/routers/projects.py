from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.database import mongo_db
from app.deps import get_current_user_email
from app.schemas import ProjectCreate

router = APIRouter()


@router.post("")
def create_project(payload: ProjectCreate, email: str = Depends(get_current_user_email)) -> dict:
    result = mongo_db["projects"].insert_one(
        {
            "name": payload.name,
            "repo_url": payload.repo_url,
            "language": payload.language,
            "owner_email": email,
            "created_at": datetime.now(timezone.utc),
        }
    )
    return {"project_id": str(result.inserted_id)}


@router.get("")
def list_projects(email: str = Depends(get_current_user_email)) -> list[dict]:
    projects = []
    for project in mongo_db["projects"].find({"owner_email": email}):
        project["id"] = str(project.pop("_id"))
        projects.append(project)
    return projects

