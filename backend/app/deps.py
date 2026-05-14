from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config import settings

auth_scheme = HTTPBearer()


def get_current_user_email(
    credentials: HTTPAuthorizationCredentials = Depends(auth_scheme),
) -> str:
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        email = payload.get("sub")
        if not email:
            raise ValueError("Missing subject")
        return str(email)
    except (JWTError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc

