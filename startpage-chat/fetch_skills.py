#!/usr/bin/env python3
"""Fetch last-30d of selected Startpage skill trackers from Supabase (direct path).

Reads the user's OWN data via Supabase Auth + Data REST (anon key + email/password
session), exactly like the frontend, but over the direct lane — the Cloudflare
worker is for external integrations and NOT used for skill trackers.

Usage:
  fetch_skills.py --secrets /path/to/.env coding fitness
  (extra CLI args = skill codes to include; pass at least one)

Output: compact data block, one line per skill, DB tracker codes + decoded values.
Decoding mirrors startpage.js: fitness -> A-F (FITNESS_TRAINING_CYCLE),
standup -> 0-3, others -> 0/1.
"""
import argparse
import datetime as dt
import json
import os
import sys
import urllib.parse
import urllib.request

FITNESS_CYCLE = ["A", "B", "C", "D", "E", "F"]
FITNESS = "fitness"
STANDUP = "standup"


def load_secrets(path):
    out = {}
    with open(path, "r") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def api(url, secret_key, headers=None, payload=None, method=None):
    h = {"apikey": secret_key, "Authorization": f"Bearer {secret_key}"}
    if headers:
        h.update(headers)
    data = None
    if payload is not None:
        data = json.dumps(payload).encode()
        h.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(
        url, data=data, headers=h, method=method or ("POST" if data else "GET")
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def auth_token(base, anon_key, email, password):
    url = f"{base}/auth/v1/token?grant_type=password"
    body = {"email": email, "password": password}
    return api(url, anon_key, payload=body)["access_token"]


def get_trackers(base, access_tok):
    url = f"{base}/rest/v1/trackers?select=code,id&limit=1000"
    return api(url, access_tok, headers={"Authorization": f"Bearer {access_tok}"})


def get_values(base, access_tok, tracker_ids, since):
    ts = since.isoformat()
    ids = ",".join(tracker_ids)
    url = (
        f"{base}/rest/v1/tracker_daily_values?"
        f"select=tracker_id,tracked_on,value&"
        f"tracker_id=in.({ids})&tracked_on=gte.{ts}"
    )
    return api(
        url, access_tok,
        headers={"Authorization": f"Bearer {access_tok}", "Prefer": "count=exact"},
    )


def decode(code, value):
    name = code.split(":", 1)[-1] if ":" in code else code
    if name == FITNESS:
        return FITNESS_CYCLE[value - 1] if 1 <= value <= len(FITNESS_CYCLE) else "0"
    if name == STANDUP:
        return str(max(0, min(3, int(value) or 0)))
    return "1" if int(value or 0) > 0 else "0"


def mmdd(iso_date):
    return iso_date[5:7] + iso_date[8:10]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--secrets", required=True)
    ap.add_argument("skills", nargs="+")
    args = ap.parse_args()
    s = load_secrets(args.secrets)
    for k in ("SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_EMAIL", "SUPABASE_PASSWORD"):
        if not s.get(k):
            print(f"missing {k} in {args.secrets}", file=sys.stderr)
            sys.exit(2)
    base = s["SUPABASE_URL"].rstrip("/")
    anon = s["SUPABASE_ANON_KEY"]
    tok = auth_token(base, anon, s["SUPABASE_EMAIL"], s["SUPABASE_PASSWORD"])

    trackers = get_trackers(base, tok)
    by_code = {t["code"]: t["id"] for t in trackers}
    selected = {}
    for skill in args.skills:
        code = f"skill:{skill}"
        tid = by_code.get(code)
        if tid:
            selected[code] = tid
        else:
            print(f"skill not found: {skill} ({code})", file=sys.stderr)
    if not selected:
        print("no matching trackers selected", file=sys.stderr)
        sys.exit(1)

    since = dt.date.today() - dt.timedelta(days=29)
    rows = get_values(base, tok, list(selected.values()), since)

    by_tracker = {}
    for r in rows:
        by_tracker.setdefault(r["tracker_id"], []).append(r)
    code_by_id = {v: k for k, v in selected.items()}

    for tid in sorted(by_tracker, key=lambda i: code_by_id[i]):
        code = code_by_id[tid]
        days = sorted(by_tracker[tid], key=lambda r: r["tracked_on"])
        out = " · ".join(f"{mmdd(r['tracked_on'])} {decode(code, r['value'])}" for r in days)
        print(f"{code} {out}")


if __name__ == "__main__":
    main()