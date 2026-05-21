"""Step 9: Production-style continuous copier loop (alias of step 7/8)."""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from engine.copier_engine import CopierEngine


if __name__ == "__main__":
    print("Delta Engine copier loop — Ctrl+C to stop")
    CopierEngine().run()
