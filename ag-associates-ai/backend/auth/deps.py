"""FastAPI dependencies that bridge Google OAuth → RBAC AuthContext.

Combines require_user (session cookie) with a Supabase profiles lookup
to produce an AuthContext that require_permission() gates can use.
"""

import os
from typing import Callable

import httpx
from fastapi import Depends

from .google_oauth import require_user
from .rbac import AuthContext, Role


async def _fetch_role(user_jwt: str, email: str) -> Role:
    """Lookup user's role from Supabase profiles table using user's JWT.

    Falls back to BANK_VIEWER when Supabase is unavailable (dev mode).
    """
    supabase_url = os.environ.get("SUPABASE_URL", "")
    supabase_anon_key = os.environ.get("SUPABASE_ANON_KEY", "")
    if not supabase_url or not supabase_anon_key:
        return Role.BANK_VIEWER

    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(
                f"{supabase_url}/rest/v1/profiles",
                params={"select": "role", "email": f"eq.{email}"},
                headers={
                    "apikey": supabase_anon_key,
                    "Authorization": f"Bearer {user_jwt}",
                },
            )
            if resp.status_code == 200 and resp.json():
                return Role.from_str(resp.json()[0].get("role", "BANK_VIEWER"))
    except Exception:
        pass
    return Role.BANK_VIEWER


async def require_auth(user: dict = Depends(require_user)) -> AuthContext:
    """FastAPI dependency — produces AuthContext from session cookie.

    Usage:
        @router.get("/cases")
        async def list_cases(auth: AuthContext = Depends(require_auth)):
            auth.require("case.view_all")
    """
    email = user.get("sub", "")
    user_jwt = user.get("access_token", "")  # Google OAuth provides access_token
    role = await _fetch_role(user_jwt, email)
    return AuthContext(
        user_id=email,
        role=role,
        name=user.get("name", ""),
    )


def require_permission(permission_code: str) -> Callable:
    """FastAPI dependency factory — gates an endpoint by permission.

    Usage:
        @router.post("/noi/workflow")
        async def noi_workflow(
            request: NOIWorkflowRequest,
            auth: AuthContext = Depends(require_permission("noi.initiate")),
        ):
            ...
    """

    async def checker(auth: AuthContext = Depends(require_auth)) -> None:
        auth.require(permission_code)

    return checker
