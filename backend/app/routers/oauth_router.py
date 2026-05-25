from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse

from app.oauth import oauth

router = APIRouter()


@router.get("/github/login")
async def github_login(request: Request):

    redirect_uri = request.url_for(
        "github_callback"
    )

    return await oauth.github.authorize_redirect(
        request,
        redirect_uri
    )


@router.get("/github/callback")
async def github_callback(request: Request):

    token = await oauth.github.authorize_access_token(
        request
    )

    user_data = await oauth.github.get(
        "user",
        token=token
    )

    user = user_data.json()

    email = user.get("email")

    frontend_url = (
        f"http://localhost:5173?"
        f"token=temp_token&email={email}"
    )

    return RedirectResponse(frontend_url)