"""Bridge to the contentflow engine.

No rewrite: `will content ...` runs the contentflow CLI with the same arguments.
The engine keeps owning lane codes, ladders, card ids and the event log.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

FALLBACKS = (
    Path.home() / "Documents" / "coding" / "contentflow" / "contentflow.py",
)


def launcher() -> list[str]:
    env = os.environ.get("CONTENTFLOW_CLI")
    if env:
        return [env]
    found = shutil.which("content")
    if found:
        return [found]
    for candidate in FALLBACKS:
        if candidate.exists():
            return [sys.executable, str(candidate)]
    raise SystemExit("contentflow CLI not found: install the `content` launcher or set CONTENTFLOW_CLI")


def run(args: list[str]) -> int:
    return subprocess.run([*launcher(), *args]).returncode


def capture(args: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run([*launcher(), *args], capture_output=True, text=True)


def add_card(title: str, lane: str, kind: str = "idea", note: str = "") -> str:
    argv = ["add", title, "--lane", lane, "--kind", kind]
    if note:
        argv += ["--note", note]
    result = capture(argv)
    if result.returncode != 0:
        raise SystemExit(result.stderr.strip() or result.stdout.strip() or "contentflow add failed")
    return result.stdout.strip()
