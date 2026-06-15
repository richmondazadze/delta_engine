"""Step 8: Copier loop with SL/TP/close/modify (configure copiers.yaml flags)."""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from engine.master_supervisor import run_all_masters


def main():
    print(
        "Starting copier with SL/TP/close/modify support.\n"
        "On MASTER: change SL/TP or close a position that was copied.\n"
        "Supports multiple masters concurrently (one process per master).\n"
        "Press Ctrl+C to stop.\n"
    )
    run_all_masters()
    return 0


if __name__ == "__main__":
    import multiprocessing as mp

    mp.freeze_support()
    raise SystemExit(main())
