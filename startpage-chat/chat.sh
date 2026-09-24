#!/usr/bin/env bash
# startpage-chat — v0.1
# Chat with your local llama about your Startpage skills/gamify data.
# Picks skills (checkbox), injects last-30d data from Supabase, calls `ai --llama`.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${HERE}/.env"
FETCH="${HERE}/fetch_skills.py"
OUT="${HERE}/.data.json"

# ---- load creds ----
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  echo "Copy .env.example to .env and set SUPABASE_URL, SUPABASE_ANON_KEY," >&2
  echo "SUPABASE_EMAIL, SUPABASE_PASSWORD." >&2
  exit 1
fi
set -a; source "$ENV_FILE"; set +a

# ---- ensure creds present ----
for v in SUPABASE_URL SUPABASE_ANON_KEY; do
  [[ -n "${!v:-}" ]] || { echo "Missing $v in $ENV_FILE" >&2; exit 1; }
done

# ---- pick skills (checkbox UI) ----
SKILLS=(coding content fitness standup meditation)
SELECTED=()
echo "Select skills to include (toggle each, then enter 'go'):"
PS3='skill> '
SELECT=("${SKILLS[@]}" done)
while true; do
  echo "---"
  for i in "${!SKILLS[@]}"; do
    if [[ " ${SELECTED[*]} " == *" ${SKILLS[$i]} "* ]]; then m="[x]"; else m="[ ]"; fi
    printf '  %s %s\n' "$m" "${SKILLS[$i]}"
  done
  printf '  [ ] done\n'
  read -r -ep "toggle (name, or 'go')> " choice || break
  case "$choice" in
    go|done|"") break ;;
    coding|content|fitness|standup|meditation)
      if [[ " ${SELECTED[*]} " == *" $choice "* ]]; then
        SELECTED=(${SELECTED[@]/$choice})
      else
        SELECTED+=("$choice")
      fi
      ;;
    *) echo "unknown: $choice" ;;
  esac
done

if [[ ${#SELECTED[@]} -eq 0 ]]; then
  echo "No skills selected. Exiting." >&2
  exit 0
fi

# ---- read prompt ----
read -r -ep "prompt> " prompt || exit 0
[[ -n "${prompt//[[:space:]]/}" ]] || { echo "empty prompt"; exit 0; }

# ---- fetch data via python (auth + REST + decode) ----
echo "Fetching last-30d data for: ${SELECTED[*]} ..."
if ! python3 "$FETCH" --secrets "$ENV_FILE" "${SELECTED[@]}" > "$OUT" 2>/tmp/startpage-chat.err; then
  echo "fetch failed:" >&2; cat /tmp/startpage-chat.err >&2; exit 1
fi

# ---- build context block ----
CTX="Last 30 days of your Startpage skill trackers (DB codes; fitness=A-F, standup=0-3, others 0/1):
$(cat "$OUT")"

# ---- call llama ----
echo "asking llama... (may take a bit on CPU)"
ai --llama --system "You summarize Illan's tracked skill data honestly. Use only the provided data; do not invent values." "$CTX

$prompt" 2>/tmp/startpage-chat-llama.err || {
  echo "llama call failed:" >&2; tail -20 /tmp/startpage-chat-llama.err >&2; exit 1
}