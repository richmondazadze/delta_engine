"""Step 8: Copier loop with SL/TP/close/modify (configure copiers.yaml flags)."""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from engine.copier_engine import CopierEngine


def main():
    print(
        "Starting copier with SL/TP/close/modify support.\n"
        "On MASTER: change SL/TP or close a position that was copied.\n"
        "Press Ctrl+C to stop.\n"
    )
    CopierEngine().run()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
