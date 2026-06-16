"""Execution SLA aggregates — p50/p95/p99 latency and failure rates."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Optional


def _percentile(values: list[int], pct: float) -> Optional[int]:
    if not values:
        return None
    ordered = sorted(values)
    idx = int(round((pct / 100.0) * (len(ordered) - 1)))
    idx = max(0, min(len(ordered) - 1, idx))
    return ordered[idx]


def _metric_stats(values: list[int]) -> dict[str, Optional[int]]:
    if not values:
        return {"count": 0, "avg": None, "p50": None, "p95": None, "p99": None, "max": None}
    return {
        "count": len(values),
        "avg": round(sum(values) / len(values)),
        "p50": _percentile(values, 50),
        "p95": _percentile(values, 95),
        "p99": _percentile(values, 99),
        "max": max(values),
    }


def build_execution_sla(
    sb,
    user_id: str,
    *,
    hours: int = 24,
) -> dict[str, Any]:
    since = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()

    rows = (
        sb.table("execution_events")
        .select(
            "copier_relation_id,status,event_type,e2e_ms,order_ms,switch_ms,"
            "latency_ms,created_at,follower_account_id"
        )
        .eq("user_id", user_id)
        .gte("created_at", since)
        .order("created_at", desc=True)
        .limit(5000)
        .execute()
    ).data or []

    e2e_vals: list[int] = []
    order_vals: list[int] = []
    switch_vals: list[int] = []
    failed = 0
    executed = 0
    by_copier: dict[str, dict[str, Any]] = {}

    success_status = {"success", "closed", "modified", "partial"}
    fail_status = {"failed", "rejected"}

    for row in rows:
        status = row.get("status") or ""
        if status in success_status:
            executed += 1
        if status in fail_status:
            failed += 1

        e2e = row.get("e2e_ms")
        if e2e is None:
            e2e = row.get("latency_ms")
        order = row.get("order_ms")
        switch = row.get("switch_ms")

        if e2e is not None:
            e2e_vals.append(int(e2e))
        if order is not None:
            order_vals.append(int(order))
        if switch is not None:
            switch_vals.append(int(switch))

        cid = row.get("copier_relation_id") or "unknown"
        bucket = by_copier.setdefault(
            cid,
            {"e2e": [], "order": [], "switch": [], "failed": 0, "executed": 0},
        )
        if e2e is not None:
            bucket["e2e"].append(int(e2e))
        if order is not None:
            bucket["order"].append(int(order))
        if switch is not None:
            bucket["switch"].append(int(switch))
        if status in fail_status:
            bucket["failed"] += 1
        if status in success_status:
            bucket["executed"] += 1

    total = len(rows)
    failure_rate = round((failed / total) * 100, 2) if total else 0.0

    # SLA targets (competitive copier benchmarks)
    targets = {
        "e2e_p95_ms": 500,
        "order_p95_ms": 300,
        "switch_p95_ms": 200,
        "failure_rate_pct": 2.0,
    }

    e2e_stats = _metric_stats(e2e_vals)
    order_stats = _metric_stats(order_vals)
    switch_stats = _metric_stats(switch_vals)

    breaches: list[str] = []
    if e2e_stats["p95"] is not None and e2e_stats["p95"] > targets["e2e_p95_ms"]:
        breaches.append(f"e2e p95 {e2e_stats['p95']}ms > {targets['e2e_p95_ms']}ms target")
    if order_stats["p95"] is not None and order_stats["p95"] > targets["order_p95_ms"]:
        breaches.append(f"order p95 {order_stats['p95']}ms > {targets['order_p95_ms']}ms target")
    if failure_rate > targets["failure_rate_pct"]:
        breaches.append(
            f"failure rate {failure_rate}% > {targets['failure_rate_pct']}% target"
        )

    copier_rows: list[dict[str, Any]] = []
    for cid, bucket in by_copier.items():
        copier_rows.append(
            {
                "copier_id": cid,
                "e2e": _metric_stats(bucket["e2e"]),
                "order": _metric_stats(bucket["order"]),
                "switch": _metric_stats(bucket["switch"]),
                "executed": bucket["executed"],
                "failed": bucket["failed"],
            }
        )
    copier_rows.sort(key=lambda r: (r["e2e"].get("p95") or 0), reverse=True)

    return {
        "as_of": datetime.now(timezone.utc).isoformat(),
        "window_hours": hours,
        "total_events": total,
        "executed": executed,
        "failed": failed,
        "failure_rate_pct": failure_rate,
        "targets": targets,
        "breaches": breaches,
        "healthy": len(breaches) == 0 and total > 0,
        "e2e_ms": e2e_stats,
        "order_ms": order_stats,
        "switch_ms": switch_stats,
        "by_copier": copier_rows,
    }
