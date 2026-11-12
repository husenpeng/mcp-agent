#!/usr/bin/env bash
#
# Real-device smoke for TomatoRunner.
#
# There is no simulator path on purpose: synthesized touch, the lock state, and
# third-party applications only exist on hardware, so a simulator pass would
# prove nothing about the runner.
#
# Usage:
#   TOMATO_IPHONE_UDID=<udid> apps/ios/tests/phone-runner-smoke.sh
#
# The device must be connected, unlocked, and have Developer Mode on. Without
# TOMATO_IPHONE_UDID the script skips with exit 0 so CI can run it unattended.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${TOMATO_IPHONE_UDID:-}" ]]; then
  echo "phone-runner-smoke: TOMATO_IPHONE_UDID is not set; skipping the real-device pass"
  exit 0
fi

DERIVED="${TOMATO_IOS_DERIVED:-$ROOT/.derived}"

echo "phone-runner-smoke: generating the project"
xcodegen generate --quiet

run_test() {
  local name="$1"
  local log="/tmp/tomato-runner-${name}.log"
  echo "phone-runner-smoke: $name"
  if ! xcodebuild test \
      -project TomatoRemote.xcodeproj \
      -scheme TomatoRunner \
      -destination "id=${TOMATO_IPHONE_UDID}" \
      -derivedDataPath "$DERIVED" \
      -allowProvisioningUpdates \
      -only-testing:"TomatoRunner/RunnerEntry/${name}" >"$log" 2>&1; then
    echo "phone-runner-smoke: $name FAILED, log at $log"
    grep -E "error:|failed" "$log" | tail -20 || true
    exit 1
  fi
  echo "phone-runner-smoke: $name passed"
}

# Wire shapes the task loop sends to a model, with no model in the loop.
run_test testBrainWire
# Engine: observe, swipe, tap, text entry, screenshot, home.
run_test testSelfCheck
# Wire: health, pairing, bearer rejection, lease, one control call.
run_test testTransport

echo "phone-runner-smoke: all real-device checks passed"