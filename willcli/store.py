"""JSON stores: one file per domain, atomic writes, no migrations to run by hand."""

from __future__ import annotations

import json
import os
import re
import tempfile
from datetime import datetime
from pathlib import Path

DEFAULT_STORE_DIR = Path.home() / ".local" / "share" / "will"


def store_dir() -> Path:
    return Path(os.environ.get("WILL_STORE", DEFAULT_STORE_DIR)).expanduser()


def repo_root() -> Path:
    return Path(__file__).resolve().parent.parent


def data_dir() -> Path:
    override = os.environ.get("WILL_DATA_DIR")
    if override:
        return Path(override).expanduser()
    return repo_root() / "data"


def store_path(domain: str) -> Path:
    return store_dir() / f"{domain}.json"


def now_iso() -> str:
    """Local time, second precision: the wall-clock day Illan actually lived."""
    return datetime.now().astimezone().isoformat(timespec="seconds")


def today_key() -> str:
    return datetime.now().astimezone().date().isoformat()


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", str(value or "").strip().lower())
    return slug.strip("-")


def load(domain: str, default):
    path = store_path(domain)
    if not path.exists():
        return default() if callable(default) else default
    try:
        with path.open(encoding="utf-8") as handle:
            payload = json.load(handle)
    except (json.JSONDecodeError, OSError) as error:
        raise SystemExit(f"cannot read {path}: {error}")
    if not isinstance(payload, dict):
        raise SystemExit(f"{path} is not a will store object")
    return payload


def save(domain: str, payload: dict) -> Path:
    path = store_path(domain)
    path.parent.mkdir(parents=True, exist_ok=True)
    handle, tmp_name = tempfile.mkstemp(dir=str(path.parent), prefix=f".{domain}.", suffix=".tmp")
    try:
        with os.fdopen(handle, "w", encoding="utf-8") as stream:
            json.dump(payload, stream, indent=2, ensure_ascii=False)
            stream.write("\n")
        os.replace(tmp_name, path)
    except BaseException:
        Path(tmp_name).unlink(missing_ok=True)
        raise
    return path


def write_render_model(name: str, payload: dict) -> Path:
    """Write a projection file the desktop fetches. Never secrets, never notes-worthy data."""
    target = data_dir() / f"{name}.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("w", encoding="utf-8") as stream:
        json.dump(payload, stream, indent=2, ensure_ascii=False)
        stream.write("\n")
    return target
