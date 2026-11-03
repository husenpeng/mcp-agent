#!/bin/bash
# Probe every chat model on the blueai relay with the exact wire requests the
# harness would send for each declared thinking level, and record outcomes.
# Usage: run-matrix.sh <results-dir>
set -u
BASE="https://bmc-llm-relay.bluemediagroup.cn/v1"
CRED="/Users/underdog/.tomato/.credentials.yaml"
KEY="$(awk '/^refs:/{f=1;next} f && /^  BLUEAI_API_KEY:/{sub(/^  BLUEAI_API_KEY:[ ]*/,""); gsub(/"/,""); print; exit}' "$CRED")"
if [ -z "$KEY" ]; then echo "FATAL: no BLUEAI_API_KEY" >&2; exit 2; fi
OUT="${1:?results dir}"
mkdir -p "$OUT"
TSV="$OUT/matrix.tsv"
printf 'model\tlevel\thttp\ttime_s\tprompt_tok\tcompletion_tok\treasoning_tok\trc_len\tfinish\tcontent\terror\n' > "$TSV"
export BASE KEY OUT TSV

# Non-chat models on the relay (embeddings / rerank / image generation).
NON_CHAT='Doubao-embedding
Doubao-Seedream-4.0
Doubao-Seedream-4.5
Doubao-Seedream-5.0-lite
gte-rerank-v2
qwen-image-2.0
qwen-image-2.0-pro
text-embedding-3-large
text-embedding-3-small
text-embedding-ada-002
text-embedding-v4
z-image-turbo'

MODELS="$(curl -sS -m 30 -H "Authorization: Bearer $KEY" "$BASE/models" \
  | jq -r '.data[].id' | grep -vxF -f <(printf '%s\n' "$NON_CHAT"))"
echo "chat models to probe: $(printf '%s\n' "$MODELS" | wc -l | tr -d ' ')" | tee "$OUT/count.txt"

PROMPT='Compute 47*89. Reply with only the final number, nothing else.'
export PROMPT

probe() {
  local model="$1" level="$2" body safe cw code ts
  # Mirror llm-pi-ai dispatch: DeepSeek models declare thinkingFormat: deepseek,
  # so a selected level sends thinking:{type:enabled}+reasoning_effort and the
  # no-level request sends thinking:{type:disabled}; every other model sends
  # reasoning_effort only, and nothing when the level is off.
  if [ "${model#DeepSeek-}" != "$model" ]; then
    if [ "$level" = off ]; then
      body=$(jq -nc --arg m "$model" --arg p "$PROMPT" '{model:$m,messages:[{role:"user",content:$p}],thinking:{type:"disabled"}}')
    else
      body=$(jq -nc --arg m "$model" --arg p "$PROMPT" --arg e "$level" '{model:$m,messages:[{role:"user",content:$p}],thinking:{type:"enabled"},reasoning_effort:$e}')
    fi
  else
    if [ "$level" = off ]; then
      body=$(jq -nc --arg m "$model" --arg p "$PROMPT" '{model:$m,messages:[{role:"user",content:$p}]}')
    else
      body=$(jq -nc --arg m "$model" --arg p "$PROMPT" --arg e "$level" '{model:$m,messages:[{role:"user",content:$p}],reasoning_effort:$e}')
    fi
  fi
  safe="$OUT/$(printf '%s' "$model" | tr -c 'A-Za-z0-9._-' '_')"
  cw=$(curl -sS -m 150 -o "$safe.$level.json" -w '%{http_code} %{time_total}' \
    -H "Authorization: Bearer $KEY" -H 'Content-Type: application/json' \
    -d "$body" "$BASE/chat/completions" 2>"$safe.$level.err") || true
  code=${cw%% *}; ts=${cw##* }
  [ -z "$cw" ] && { code=CURLFAIL; ts=0; }
  local f="$safe.$level.json"
  local pt ct rt rc fin content err
  pt=$(jq -r '.usage.prompt_tokens // "-"' "$f" 2>/dev/null) || pt=-
  ct=$(jq -r '.usage.completion_tokens // .usage.output_tokens // "-"' "$f" 2>/dev/null) || ct=-
  rt=$(jq -r '(.usage.completion_tokens_details.reasoning_tokens // .usage.reasoning_tokens // .usage.output_tokens_details.reasoning_tokens // 0)' "$f" 2>/dev/null) || rt=-
  rc=$(jq -r '(.choices[0].message.reasoning_content // .choices[0].message.reasoning // "" | length)' "$f" 2>/dev/null) || rc=-
  fin=$(jq -r '(.choices[0].finish_reason // "-")' "$f" 2>/dev/null) || fin=-
  content=$(jq -r '(.choices[0].message.content // "" | tostring | gsub("[\n\t]";" ") | .[0:60])' "$f" 2>/dev/null) || content=
  err=$(jq -r '(.error.message // .message // "" | tostring | gsub("[\n\t]";" ") | .[0:120])' "$f" 2>/dev/null) || err=
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$model" "$level" "$code" "$ts" "$pt" "$ct" "$rt" "$rc" "$fin" "$content" "$err" >> "$TSV"
}
export -f probe

printf '%s\n' "$MODELS" | xargs -P 6 -I MODEL bash -c 'for L in off low medium high max; do probe "MODEL" "$L"; done'
echo "done: $(wc -l < "$TSV") rows" | tee -a "$OUT/count.txt"
