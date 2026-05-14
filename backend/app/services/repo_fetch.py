from __future__ import annotations

import shutil
import tempfile
import zipfile
from pathlib import Path
from urllib.parse import urlparse

import httpx


def _repo_zip_candidates(owner: str, repo: str) -> list[str]:
    return [
        f"https://github.com/{owner}/{repo}/archive/refs/heads/main.zip",
        f"https://github.com/{owner}/{repo}/archive/refs/heads/master.zip",
    ]


def _extract_zip_to_temp(zip_path: Path) -> Path:
    temp_dir = Path(tempfile.mkdtemp(prefix="repo_scan_"))
    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        zip_ref.extractall(temp_dir)
    children = [item for item in temp_dir.iterdir() if item.is_dir()]
    if children:
        return children[0]
    return temp_dir


def prepare_repo_path(repo_ref: str) -> tuple[Path, bool]:
    # local path mode
    local_path = Path(repo_ref)
    if local_path.exists():
        return local_path, False

    # github public url mode
    parsed = urlparse(repo_ref)
    if parsed.netloc not in {"github.com", "www.github.com"}:
        raise ValueError("Only local paths or public GitHub URLs are supported")

    parts = [part for part in parsed.path.split("/") if part]
    if len(parts) < 2:
        raise ValueError("Invalid GitHub repository URL")
    owner, repo = parts[0], parts[1].removesuffix(".git")

    temp_download_dir = Path(tempfile.mkdtemp(prefix="repo_zip_"))
    zip_path = temp_download_dir / "repo.zip"

    download_ok = False
    last_error = ""
    for candidate in _repo_zip_candidates(owner, repo):
        try:
            with httpx.Client(timeout=30.0, follow_redirects=True) as client:
                response = client.get(candidate)
                if response.status_code == 200:
                    zip_path.write_bytes(response.content)
                    download_ok = True
                    break
                last_error = f"{response.status_code}"
        except Exception as exc:
            last_error = str(exc)

    if not download_ok:
        shutil.rmtree(temp_download_dir, ignore_errors=True)
        raise ValueError(f"Unable to fetch repository zip from GitHub ({last_error})")

    extracted = _extract_zip_to_temp(zip_path)
    shutil.rmtree(temp_download_dir, ignore_errors=True)
    return extracted, True

