"""Finance: income and expense entries, one file, month summaries.

The old window had categories, budgets, recurring entries and a pie chart. This
is the part that matters: what came in, what went out, when.
"""

from __future__ import annotations

from . import store

KINDS = ("expense", "income")
DEFAULT_KIND = "expense"


def blank() -> dict:
    return {"version": 1, "next_id": 1, "entries": []}


def load() -> dict:
    payload = store.load("finance", blank)
    payload.setdefault("entries", [])
    payload.setdefault("next_id", 1)
    return payload


def normalize_kind(kind: str) -> str:
    wanted = str(kind or DEFAULT_KIND).strip().lower()
    return wanted if wanted in KINDS else DEFAULT_KIND


def to_cents(amount) -> int:
    """Money is stored in cents: no float drift on a ledger."""
    text = str(amount).strip().replace("R$", "").replace(" ", "")
    if "," in text and "." in text:
        text = text.replace(".", "").replace(",", ".")
    elif "," in text:
        text = text.replace(",", ".")
    try:
        return int(round(float(text) * 100))
    except ValueError:
        raise SystemExit(f"not an amount: {amount}")


def from_cents(cents: int) -> str:
    return f"{cents / 100:.2f}"


def add(payload: dict, amount, kind: str = DEFAULT_KIND, category: str = "", note: str = "", day: str = "") -> dict:
    entry = {
        "id": int(payload.get("next_id", 1)),
        "date": str(day or store.today_key()).strip(),
        "kind": normalize_kind(kind),
        "amount_cents": to_cents(amount),
        "category": str(category or "").strip(),
        "note": str(note or "").strip(),
        "created_at": store.now_iso(),
    }
    payload["next_id"] = entry["id"] + 1
    payload["entries"].append(entry)
    return entry


def find(payload: dict, entry_id: int):
    for entry in payload["entries"]:
        if int(entry.get("id", -1)) == int(entry_id):
            return entry
    return None


def remove(payload: dict, entry_id: int) -> dict:
    entry = find(payload, entry_id)
    if not entry:
        raise SystemExit(f"no entry {entry_id}")
    payload["entries"].remove(entry)
    return entry


def month_totals(payload: dict, month: str = "") -> dict:
    prefix = (month or store.today_key()[:7]).strip()
    income = sum(int(entry.get("amount_cents", 0)) for entry in payload["entries"]
                 if entry.get("kind") == "income" and str(entry.get("date", "")).startswith(prefix))
    expense = sum(int(entry.get("amount_cents", 0)) for entry in payload["entries"]
                  if entry.get("kind") == "expense" and str(entry.get("date", "")).startswith(prefix))
    return {
        "month": prefix,
        "income_cents": income,
        "expense_cents": expense,
        "net_cents": income - expense,
        "count": len([entry for entry in payload["entries"] if str(entry.get("date", "")).startswith(prefix)]),
    }


def summary(payload: dict, month: str = "") -> dict:
    prefix = (month or store.today_key()[:7]).strip()
    months: dict[str, dict[str, int]] = {}
    for entry in payload["entries"]:
        key = str(entry.get("date", ""))[:7]
        bucket = months.setdefault(key, {"income_cents": 0, "expense_cents": 0, "count": 0})
        bucket["count"] += 1
        if entry.get("kind") == "income":
            bucket["income_cents"] += int(entry.get("amount_cents", 0))
        else:
            bucket["expense_cents"] += int(entry.get("amount_cents", 0))

    categories: dict[str, int] = {}
    for entry in payload["entries"]:
        if str(entry.get("date", ""))[:7] != prefix or entry.get("kind") != "expense":
            continue
        key = str(entry.get("category") or "uncategorized")
        categories[key] = categories.get(key, 0) + int(entry.get("amount_cents", 0))

    recent = sorted(payload["entries"], key=lambda entry: (entry.get("date", ""), int(entry.get("id", 0))), reverse=True)
    return {
        "totals": month_totals(payload, prefix),
        "months": dict(sorted(months.items())),
        "categories": dict(sorted(categories.items(), key=lambda item: -item[1])),
        "recent": recent[:40],
    }
