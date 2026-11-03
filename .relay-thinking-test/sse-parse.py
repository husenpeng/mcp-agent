"""Parse one SSE chat-completions stream file into summary JSON."""
import json
import re
import sys

path = sys.argv[1]
completion = None
reasoning = None
reasoning_chars = 0
finish = None
content = ""
error = ""
try:
    text = open(path, encoding="utf-8", errors="replace").read()
except OSError as exc:
    print(json.dumps({"error": f"unreadable: {exc}"}))
    raise SystemExit
for line in text.splitlines():
    line = line.strip()
    if not line.startswith("data:"):
        continue
    payload = line[5:].strip()
    if payload == "[DONE]":
        continue
    try:
        frame = json.loads(payload)
    except json.JSONDecodeError:
        continue
    if isinstance(frame.get("error"), dict):
        error = frame["error"].get("message", "")
    usage = frame.get("usage")
    if isinstance(usage, dict):
        details = usage.get("completion_tokens_details") or {}
        completion = usage.get("completion_tokens", completion)
        reasoning = details.get("reasoning_tokens", usage.get("reasoning_tokens", reasoning))
    for choice in frame.get("choices", []):
        delta = choice.get("delta") or {}
        if choice.get("finish_reason"):
            finish = choice["finish_reason"]
        rc = delta.get("reasoning_content")
        if isinstance(rc, str):
            reasoning_chars += len(rc)
        c = delta.get("content")
        if isinstance(c, str) and c:
            content += c
        msg = choice.get("message")
        if isinstance(msg, dict):
            rc2 = msg.get("reasoning_content")
            if isinstance(rc2, str):
                reasoning_chars += len(rc2)
            if msg.get("content"):
                content += str(msg["content"])
if not error:
    m = re.search(r'"message"\s*:\s*"((?:[^"\\]|\\.)*)"', text)
    if m:
        error = m.group(1)[:120]
print(json.dumps({
    "completion": completion,
    "reasoning": reasoning if reasoning is not None else 0,
    "reasoning_chars": reasoning_chars,
    "finish": finish or "-",
    "content": content[:60],
    "error": error[:120],
}))
