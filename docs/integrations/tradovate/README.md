# Tradovate integration (Phase 10)

**Status:** Blocked until API documentation is added here.

## Required from you

- API auth + demo/live environments
- Contract / symbol mapping (futures naming)
- Supported order types for copy (market, limit, brackets)
- Session model differences vs MT5 terminal
- Margin-aware risk notes

## Implementation entry point

- Worker adapter: `worker/adapters/tradovate_adapter.py`
- Enable `tradovate` in `frontend/src/lib/platforms.ts` when live
