#!/usr/bin/env python3
"""
Local full-stack smoke test — backend, frontend, worker API mode, optional MT5.

Usage:
  python scripts/17_local_full_test.py
  python scripts/17_local_full_test.py --with-mt5
  python scripts/17_local_full_test.py --email you@example.com --password 'your-password'
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys

import httpx

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from engine.env_loader import load_worker_env

WORKER_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
REPO_ROOT = os.path.abspath(os.path.join(WORKER_ROOT, ".."))
PYTHON = sys.executable


class Results:
    def __init__(self) -> None:
        self.passed: list[str] = []
        self.failed: list[str] = []
        self.skipped: list[str] = []

    def ok(self, name: str) -> None:
        self.passed.append(name)
        print(f"  PASS  {name}")

    def fail(self, name: str, detail: str = "") -> None:
        msg = f"{name}: {detail}" if detail else name
        self.failed.append(msg)
        print(f"  FAIL  {msg}")

    def skip(self, name: str, reason: str) -> None:
        self.skipped.append(f"{name} ({reason})")
        print(f"  SKIP  {name} — {reason}")


def run_cmd(cmd: list[str], cwd: str, timeout: int = 180) -> tuple[int, str]:
    proc = subprocess.run(
        cmd,
        cwd=cwd,
        capture_output=True,
        text=True,
        timeout=timeout,
        env={**os.environ},
    )
    return proc.returncode, (proc.stdout or "") + (proc.stderr or "")


def section(title: str) -> None:
    print()
    print("=" * 60)
    print(title)
    print("=" * 60)


def test_infrastructure(api_url: str, frontend_url: str, r: Results) -> None:
    section("[1] Infrastructure")
    try:
        health = httpx.get(f"{api_url}/health", timeout=10.0)
        health.raise_for_status()
        if health.json().get("status") == "ok":
            r.ok("Backend /health")
        else:
            r.fail("Backend /health", health.text)
    except Exception as exc:
        r.fail("Backend /health", str(exc))

    try:
        fe = httpx.get(f"{frontend_url}/login", timeout=15.0, follow_redirects=True)
        if fe.status_code < 500:
            r.ok(f"Frontend reachable ({frontend_url})")
        else:
            r.fail("Frontend", f"HTTP {fe.status_code}")
    except Exception as exc:
        r.fail("Frontend", str(exc))

    try:
        brokers = httpx.get(f"{api_url}/api/integrations/mt5-brokers", timeout=10.0)
        brokers.raise_for_status()
        data = brokers.json()
        if data.get("brokers"):
            r.ok(f"MT5 brokers API ({len(data['brokers'])} presets)")
        else:
            r.fail("MT5 brokers API", "empty list")
    except Exception as exc:
        r.fail("MT5 brokers API", str(exc))

    try:
        compare = httpx.get(f"{api_url}/api/compare", timeout=10.0)
        compare.raise_for_status()
        r.ok("Compare API (public)")
    except Exception as exc:
        r.fail("Compare API", str(exc))


def test_worker_unit(r: Results) -> None:
    section("[2] Worker unit tests")
    code, out = run_cmd(
        [PYTHON, "-m", "pytest", "tests/test_state_diff.py", "-q"],
        WORKER_ROOT,
        timeout=60,
    )
    if code == 0:
        r.ok("pytest test_state_diff.py")
    else:
        r.fail("pytest test_state_diff.py", out[-500:])


def test_runtime_and_api_mode(r: Results, with_mt5: bool) -> None:
    section("[3] Worker API mode (Phase 2)")
    code, out = run_cmd([PYTHON, "scripts/16_print_runtime_config.py"], WORKER_ROOT, timeout=60)
    if code == 0 and "Copiers (1)" in out or "Copiers (" in out:
        r.ok("Runtime config script (16)")
    elif code == 0:
        r.ok("Runtime config script (16) — no copiers listed")
    else:
        r.fail("Runtime config script (16)", out[-400:])

    skip = [] if with_mt5 else ["--skip-mt5"]
    code, out = run_cmd(
        [PYTHON, "scripts/12_test_api_mode.py", *skip],
        WORKER_ROOT,
        timeout=300 if with_mt5 else 120,
    )
    label = "12_test_api_mode (full MT5)" if with_mt5 else "12_test_api_mode (API only)"
    if code == 0:
        r.ok(label)
    else:
        r.fail(label, out[-600:])


def test_dashboard_api(
    api_url: str,
    supabase_url: str,
    anon_key: str,
    email: str | None,
    password: str | None,
    r: Results,
) -> None:
    section("[4] Dashboard JWT API")
    if not email or not password:
        r.skip(
            "Authenticated API routes",
            "pass --email and --password (dashboard login) for JWT tests",
        )
        return

    try:
        auth = httpx.post(
            f"{supabase_url}/auth/v1/token?grant_type=password",
            headers={"apikey": anon_key, "Content-Type": "application/json"},
            json={"email": email, "password": password},
            timeout=15.0,
        )
        auth.raise_for_status()
        token = auth.json().get("access_token")
        if not token:
            r.fail("Supabase login", "no access_token")
            return
        r.ok(f"Supabase login ({email})")
    except Exception as exc:
        r.fail("Supabase login", str(exc))
        return

    headers = {"Authorization": f"Bearer {token}"}
    routes = [
        ("GET", "/api/users/me"),
        ("GET", "/api/accounts"),
        ("GET", "/api/copiers"),
        ("GET", "/api/risk-profiles"),
        ("GET", "/api/execution-events?limit=10"),
        ("GET", "/api/analytics/summary"),
    ]
    for method, path in routes:
        try:
            resp = httpx.request(method, f"{api_url}{path}", headers=headers, timeout=15.0)
            if resp.status_code == 200:
                r.ok(f"{method} {path}")
            else:
                r.fail(f"{method} {path}", f"HTTP {resp.status_code} {resp.text[:200]}")
        except Exception as exc:
            r.fail(f"{method} {path}", str(exc))


def test_frontend_build(r: Results) -> None:
    section("[5] Frontend production build")
    frontend = os.path.join(REPO_ROOT, "frontend")
    if not os.path.isdir(frontend):
        r.skip("npm run build", "frontend/ not found")
        return
    code, out = run_cmd(["npm", "run", "build"], frontend, timeout=300)
    if code == 0:
        r.ok("npm run build")
    else:
        r.fail("npm run build", out[-800:])


def main() -> int:
    load_worker_env()
    parser = argparse.ArgumentParser(description="Local full-stack test")
    parser.add_argument("--with-mt5", action="store_true", help="Include MT5 connect/copy tests")
    parser.add_argument("--skip-build", action="store_true", help="Skip npm run build")
    parser.add_argument("--email", default=os.environ.get("LOCAL_TEST_EMAIL", ""))
    parser.add_argument("--password", default=os.environ.get("LOCAL_TEST_PASSWORD", ""))
    args = parser.parse_args()

    api_url = os.environ.get("API_URL", "http://localhost:8000").rstrip("/")
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    anon_key = os.environ.get("SUPABASE_ANON_KEY", "")

    print("Delta Engine — Local Full Test")
    print(f"  API_URL:     {api_url}")
    print(f"  Frontend:    {frontend_url}")
    print(f"  Config:      {os.environ.get('DELTA_CONFIG_SOURCE', 'yaml')}")
    print(f"  WORKER_USER: {os.environ.get('WORKER_USER_ID', '')[:8]}…")

    r = Results()
    test_infrastructure(api_url, frontend_url, r)
    test_worker_unit(r)
    test_runtime_and_api_mode(r, with_mt5=args.with_mt5)
    test_dashboard_api(
        api_url,
        supabase_url,
        anon_key,
        args.email or None,
        args.password or None,
        r,
    )
    if not args.skip_build:
        test_frontend_build(r)
    else:
        r.skip("npm run build", "--skip-build")

    section("SUMMARY")
    print(f"  PASSED:  {len(r.passed)}")
    print(f"  FAILED:  {len(r.failed)}")
    print(f"  SKIPPED: {len(r.skipped)}")
    if r.failed:
        print("\nFailures:")
        for item in r.failed:
            print(f"  - {item}")
        print("\nFix failures above, then re-run:")
        print("  python scripts\\17_local_full_test.py --with-mt5 --skip-build")
        return 1

    print("\nAll automated checks passed.")
    print("\nManual checklist (with copier loop running):")
    print("  1. cd worker && python scripts\\09_run_copier_loop.py")
    print("  2. Open trade on MASTER account in MT5")
    print("  3. Confirm follower copy + Forensic Logs in dashboard")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
