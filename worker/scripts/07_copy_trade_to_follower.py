"""Step 7: Run copier loop once — detects master changes and copies to follower(s)."""

import argparse

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from engine.copier_engine import CopierEngine


def main():
    parser = argparse.ArgumentParser(description="Run continuous copier loop")
    parser.add_argument("--master", "-m", help="Master account id")
    args = parser.parse_args()

    engine = CopierEngine()
    engine.run(master_id=args.master)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
