#!/bin/bash
# Sequential retests for matrix rows whose failures looked transient or
# account-related rather than reasoning-effort related: Claude via Bedrock
# (access errors), qwen-turbo (429), and DeepSeek-V4-Pro-0813 content check.
# Usage: run-retest.sh <results-dir>
set -u
BASE="https://bmc-llm-relay.bluemediagroup.cn/v1"
CRED="/Users/underdog/.tomato/.credentials.yaml"
KEY="$(awk '/^refs:/{f=1;next} f && /^  BLUEAI_API_KEY:/{sub(/^  BLUEAI_API_KEY:[ ]*/,""); gsub(/"/,""); print; exit}' "$CRED")"
OUT="${1:?results dir}"; mkdir -p "$OUT"
TSV="$OUT/retest.tsv"
printf 'model\tlevel\thttp\ttime_s\tcompletion_tok\treasoning_tok\trc_len\tfinish\tcontent\terror\n' > "$TSV"
PROMPT='Compute 47*89. Reply with only the final number, nothing else.'

hit() { # hit <model> <level> <body-json>
  local model="$1" level="$2" body="$3" cw code ts f rest
  f="$OUT/$(printf '%s' "$model" | tr -c 'A-Za-z0-9._-' '_').$level.json"
  cw=$(curl -sS -m 150 -o "$f" -w '%{http_code} %{time_total}' \
    -H "Authorization: Bearer $KEY" -H 'Content-Type: application/json' \
    -d "$body" "$BASE/chat/completions" 2>"$f.err") || true
  code=${cw%% *}; ts=${cw##* }; [ -z "$cw" ] && { code=CURLFAIL; ts=0; }
  rest=$(jq -c '{ct:(.usage.completion_tokens // .usage.output_tokens // 0),
                 rt:(.usage.completion_tokens_details.reasoning_tokens // .usage.reasoning_tokens // 0),
                 rc:((.choices[0].message.reasoning_content // "")|length),
                 fin:(.choices[0].finish_reason // "-"),
                 content:((.choices[0].message.content // "")|tostring|gsub("[\n\t]";" ")|.[0:60]),
                 error:((.error.message // "")|tostring|gsub("[\n\t]";" ")|.[0:150])}' "$f" 2>/dev/null || echo '{}')
  jq -r --arg m "$model" --arg l "$level" --arg c "$code" --arg t "$ts" \
    '[$m,$l,$c,$t,(.ct//"-"),(.rt//"0"),(.rc//"0"),(.fin//"-"),(.content//""),(.error//"")] | @tsv' <<<"$rest" >> "$TSV"
  sleep 2
}

for MODEL in claude-haiku-4-5-20251001 claude-opus-4-5-20251101 claude-opus-4-6-v1 claude-opus-4-7 claude-opus-5 claude-haiku-5-5 qwen-turbo DeepSeek-V4-Pro-0813; do
  for L in off low medium high max; do
    if [ "$MODEL" = DeepSeek-V4-Pro-0813 ]; then
      if [ "$L" = off ]; then
        BODY=$(jq -nc --arg m "$MODEL" --arg p "$PROMPT" '{model:$m,messages:[{role:"user",content:$p}],thinking:{type:"disabled"}}')
      else
        BODY=$(jq -nc --arg m "$MODEL" --arg p "$PROMPT" --arg e "$L" '{model:$m,messages:[{role:"user",content:$p}],thinking:{type:"enabled"},reasoning_effort:$e}')
      fi
    else
      if [ "$L" = off ]; then
        BODY=$(jq -nc --arg m "$MODEL" --arg p "$PROMPT" '{model:$m,messages:[{role:"user",content:$p}]}')
      else
        BODY=$(jq -nc --arg m "$MODEL" --arg p "$PROMPT" --arg e "$L" '{model:$m,messages:[{role:"user",content:$p}],reasoning_effort:$e}')
      fi
    fi
    hit "$MODEL" "$L" "$BODY"
  done
done
echo done
