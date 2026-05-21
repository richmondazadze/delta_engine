"""
Delta Engine — Dependency Injection
Supabase client factories and shared dependencies.
"""

from functools import lru_cache
from supabase import create_client, Client
from app.core.config import get_settings


@lru_cache()
def get_supabase_client() -> Client:
    """
    Get a Supabase client using the anon key.
    Used for user-scoped operations (respects RLS).
    """
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_anon_key)


@lru_cache()
def get_supabase_admin() -> Client:
    """
    Get a Supabase client using the service role key.
    Bypasses RLS — use only for worker/admin operations.
    """
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
