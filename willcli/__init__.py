"""willOS CLI package.

Local-first JSON stores under ~/.local/share/will/ (override with WILL_STORE),
plus one exporter per migrated window that writes the render model the desktop
draws from (data/<window>.json in the repo).

The desktop never writes. Anything that changes state lives here.
"""

__all__ = ["store", "notes", "content", "exporter", "cli"]
