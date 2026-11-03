#!/bin/bash
# Probe in-scope (recent) relay models: does a "none" effort actually disable
# thinking, and what enum does an invalid value reveal? Mirrors llm-pi-ai
# dispatch (selected effort sends reasoning_effort; DeepSeek adds thinking).
# Usage: run-none-probe.sh <results-dir>
set -u
BASE="https://bmc-llm-relay.bluemediagroup.cn/v1"
CRED="/Users/underdog/.tomato/.credentials.yaml"
KEY="$(awk '/^refs:/{f=1;next} f && /^  BLUEAI_API_KEY:/{sub(/^  BLUEAI_API_KEY:[ ]*/,""); gsub(/"/,""); print; exit}' "$CRED")"
OUT="${1:?results dir}"; mkdir -p "$OUT"
TSV="$OUT/none-probe.tsv"
printf 'model\tprobe\thttp\tcompletion_tok\treasoning_tok\trc_len\tcontent\terror\n' > "$TSV"
PROMPT='Compute 47*89. Reply with only the final number, nothing else.'

MODELS='glm-5.2
glm-5.3
glm-5.3-flash
glm-5.3-flashx
claude-opus-5
claude-opus-5-5
claude-sonnet-5
claude-sonnet-5-5
claude-haiku-5-5
gpt-5.6-luna
gpt-5.6-sol
gpt-5.6-terra
gpt-6-luna
gpt-6-sol
gpt-6.1-sol
gemini-3.7-flash
gemini-3.8-flash
gemini-4-argon
qwen3.6-plus
qwen3.7-flash
qwen3.7-max
qwen3.8-max
kimi-k3
kimi-k3.1-pro
MiniMax-M2.5
MiniMax-M2.7
MiniMax-M3
Doubao-Seed-2.1-pro
Doubao-Seed-2.1-turbo
Doubao-Seed-2.1-lite'

hit() { # hit <model> <probe-value>
  local model="$1" val="$2" body f cw code rest tries=0
  f="$OUT/$(printf '%s' "$model" | tr -c 'A-Za-z0-9._-' '_').${val}.json"
  body=$(jq -nc --arg m "$model" --arg p "$PROMPT" --arg e "$val" \
    '{model:$m,messages:[{role:"user",content:$p}],reasoning_effort:$e}')
  while :; do
    cw=$(curl -sS -m 120 -o "$f" -w '%{http_code}' \
      -H "Authorization: Bearer $KEY" -H 'Content-Type: application/json' \
      -d "$body" "$BASE/chat/completions" 2>>"$f.err") || true
    code=${cw:-CURLFAIL}
    # Bedrock account flakiness: retry access-denied 400s a couple of times.
    if [ "$code" = 200 ] || [ $tries -ge 2 ]; then break; fi
    if jq -e '.error.message // "" | test("Access to Anthropic")' "$f" >/dev/null 2>&1; then
      tries=$((tries+1)); sleep 3
    else
      break
    fi
  done
  rest=$(jq -c '{ct:(.usage.completion_tokens // .usage.output_tokens // 0),
                 rt:(.usage.completion_tokens_details.reasoning_tokens // .usage.reasoning_tokens // 0),
                 rc:((.choices[0].message.reasoning_content // "")|length),
                 content:((.choices[0].message.content // "")|tostring|gsub("[\n\t]";" ")|.[0:40]),
                 error:((.error.message // "")|tostring|gsub("[\n\t]";" ")|.[0:220])}' "$f" 2>/dev/null || echo '{}')
  jq -r --arg m "$model" --arg v "$val" --arg c "$code" \
    '[$m,$v,$c,(.ct//"-"),(.rt//"0"),(.rc//"0"),(.content//""),(.error//"")] | @tsv' <<<"$rest" >> "$TSV"
}

for M in $MODELS; do
  hit "$M" none
  hit "$M" bogus
  sleep 1
done
echo done
