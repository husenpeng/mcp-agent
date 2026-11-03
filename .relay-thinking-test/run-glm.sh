#!/bin/bash
# glm-5.3 focused statistics: repetitions per level, non-standard spellings,
# native GLM thinking parameter, and streaming checks.
# Usage: run-glm.sh <results-dir>
set -u
BASE="https://bmc-llm-relay.bluemediagroup.cn/v1"
CRED="/Users/underdog/.tomato/.credentials.yaml"
HERE="$(cd "$(dirname "$0")" && pwd)"
KEY="$(awk '/^refs:/{f=1;next} f && /^  BLUEAI_API_KEY:/{sub(/^  BLUEAI_API_KEY:[ ]*/,""); gsub(/"/,""); print; exit}' "$CRED")"
OUT="${1:?results dir}"; mkdir -p "$OUT"
TSV="$OUT/glm.tsv"
printf 'probe\thttp\ttime_s\tcompletion_tok\treasoning_tok\trc_len\tfinish\tcontent\terror\n' > "$TSV"
PROMPT='Compute 47*89. Reply with only the final number, nothing else.'
M=glm-5.3

hit() { # hit <label> <body-json> [stream]
  local label="$1" body="$2" stream="${3:-}" cw code ts f rest
  f="$OUT/${label//[^A-Za-z0-9._-]/_}.json"
  if [ -n "$stream" ]; then body=$(jq -nc --argjson b "$body" '$b + {stream:true}'); fi
  cw=$(curl -sS -m 150 -o "$f" -w '%{http_code} %{time_total}' \
    -H "Authorization: Bearer $KEY" -H 'Content-Type: application/json' \
    -d "$body" "$BASE/chat/completions" 2>"$f.err") || true
  code=${cw%% *}; ts=${cw##* }; [ -z "$cw" ] && { code=CURLFAIL; ts=0; }
  if [ -n "$stream" ]; then
    rest=$(python3 "$HERE/sse-parse.py" "$f")
    code="${code}|$(jq -r '.error' <<<"$rest" | grep -q . && echo err || echo ok)"
  else
    rest=$(jq -c '{ct:(.usage.completion_tokens // .usage.output_tokens // 0),
                   rt:(.usage.completion_tokens_details.reasoning_tokens // .usage.reasoning_tokens // .usage.output_tokens_details.reasoning_tokens // 0),
                   rc:((.choices[0].message.reasoning_content // "")|length),
                   fin:(.choices[0].finish_reason // "-"),
                   content:((.choices[0].message.content // "")|tostring|gsub("[\n\t]";" ")|.[0:60]),
                   error:((.error.message // "")|tostring|gsub("[\n\t]";" ")|.[0:120])}' "$f" 2>/dev/null || echo '{}')
  fi
  printf '%s\t%s\t%s\t%s\t%s\n' "$label" "$code" "$ts" "$rest" "$(cat "$f.err" 2>/dev/null | head -c 60)" >> "$TSV.raw"
  jq -r --arg l "$label" --arg c "$code" --arg t "$ts" \
    '[$l,$c,$t,(.ct//"-"),(.rt//"0"),(.rc//"0"),(.fin//"-"),(.content//""),(.error//"")] | @tsv' <<<"$rest" >> "$TSV"
}

for rep in 1 2 3; do
  for L in off low medium high max; do
    if [ "$L" = off ]; then
      hit "rep$rep-off" "$(jq -nc --arg m "$M" --arg p "$PROMPT" '{model:$m,messages:[{role:"user",content:$p}]}')"
    else
      hit "rep$rep-$L" "$(jq -nc --arg m "$M" --arg p "$PROMPT" --arg e "$L" '{model:$m,messages:[{role:"user",content:$p}],reasoning_effort:$e}')"
    fi
  done
done

for V in minimal none xhigh MAX; do
  hit "spell-$V" "$(jq -nc --arg m "$M" --arg p "$PROMPT" --arg e "$V" '{model:$m,messages:[{role:"user",content:$p}],reasoning_effort:$e}')"
done

hit "native-think-off" "$(jq -nc --arg m "$M" --arg p "$PROMPT" '{model:$m,messages:[{role:"user",content:$p}],thinking:{type:"disabled"}}')"
hit "native-think-on"  "$(jq -nc --arg m "$M" --arg p "$PROMPT" '{model:$m,messages:[{role:"user",content:$p}],thinking:{type:"enabled"}}')"

hit "stream-low"  "$(jq -nc --arg m "$M" --arg p "$PROMPT" --arg e low '{model:$m,messages:[{role:"user",content:$p}],reasoning_effort:$e}')" stream
hit "stream-high" "$(jq -nc --arg m "$M" --arg p "$PROMPT" --arg e high '{model:$m,messages:[{role:"user",content:$p}],reasoning_effort:$e}')" stream

echo done
