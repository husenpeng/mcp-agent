#!/bin/bash
#
# Install Tomato AI from an adjacent DMG into /Applications, then remove the
# download quarantine attribute so Gatekeeper does not block the first launch.
#
# Usage:
#   Double-click this file, or run:
#     bash install-from-dmg.command [path/to/tomato-harness-*.dmg]
#
# The DMG may sit next to this script, or the script may run from inside a
# mounted DMG where Tomato AI.app is a sibling. TOMATO_INSTALL_DIR overrides
# the destination directory.
#
# This helper does not make an unsigned build suitable for public release; it
# only installs a build the recipient explicitly trusts.

set -u

APP_NAME="Tomato AI"
INSTALL_DIR="${TOMATO_INSTALL_DIR:-/Applications}"
TARGET="$INSTALL_DIR/$APP_NAME.app"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_APP=""
MOUNT=""

say() { printf '%s\n' "$*"; }
pause_if_interactive() {
  if [[ -t 0 ]]; then
    printf '\n按回车键关闭窗口…'
    read -r _ || true
  fi
}
die() { printf '安装失败：%s\n' "$*" >&2; pause_if_interactive; exit 1; }

verify_signature() {
  local output
  if output="$(/usr/bin/codesign --verify --deep --strict --verbose=1 "$TARGET" 2>&1)"; then
    return 0
  fi
  # Deep verification also validates every nested code object. An ad-hoc build can
  # fail that while the bundle seal itself is intact, which is what Gatekeeper and
  # the launcher assess; report the reason instead of discarding it.
  if /usr/bin/codesign --verify "$TARGET" >/dev/null 2>&1; then
    say "警告：嵌套代码的严格校验未通过，应用包签名本身有效，继续完成安装。"
    printf '%s\n' "$output" >&2
    return 0
  fi
  printf '%s\n' "$output" >&2
  printf '系统版本：%s %s\n' \
    "$(/usr/bin/sw_vers -productVersion 2>/dev/null)" "$(/usr/bin/uname -m)" >&2
  return 1
}

cleanup() {
  if [[ -n "$MOUNT" ]]; then
    hdiutil detach "$MOUNT" -quiet >/dev/null 2>&1 ||
      hdiutil detach "$MOUNT" -force -quiet >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT
trap 'exit 130' INT TERM HUP

case "$TARGET" in
  *"'"*|*'"'*) die "安装路径不能包含单引号或双引号" ;;
esac

if [[ -d "$SCRIPT_DIR/$APP_NAME.app" ]]; then
  SOURCE_APP="$SCRIPT_DIR/$APP_NAME.app"
  say "使用已挂载的应用：$SOURCE_APP"
else
  DMG="${1:-}"
  if [[ -z "$DMG" ]]; then
    DMG="$(find "$SCRIPT_DIR" -maxdepth 1 -type f -iname '*.dmg' -print | sort | head -n 1)"
  fi
  [[ -n "$DMG" && -f "$DMG" ]] || die "未找到 DMG：把 DMG 放在脚本同目录，或作为第一个参数传入"
  MOUNT="$(mktemp -d "${TMPDIR:-/tmp}/tomato-install.XXXXXX")" || die "无法创建临时挂载点"
  say "正在挂载 $(basename "$DMG")…"
  hdiutil attach "$DMG" -nobrowse -readonly -mountpoint "$MOUNT" >/dev/null || die "无法挂载 DMG"
  SOURCE_APP="$MOUNT/$APP_NAME.app"
fi

[[ -d "$SOURCE_APP" ]] || die "找不到 $APP_NAME.app"
case "$SOURCE_APP" in
  *"'"*|*'"'*) die "应用路径不能包含单引号或双引号" ;;
esac

if pgrep -f "$TARGET/Contents/MacOS/$APP_NAME" >/dev/null 2>&1; then
  say "正在退出运行中的 ${APP_NAME}…"
  osascript -e "tell application \"$APP_NAME\" to quit" >/dev/null 2>&1 || true
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    pgrep -f "$TARGET/Contents/MacOS/$APP_NAME" >/dev/null 2>&1 || break
    sleep 0.5
  done
  pgrep -f "$TARGET/Contents/MacOS/$APP_NAME" >/dev/null 2>&1 && die "请先手动退出 $APP_NAME 再运行安装"
fi

install_unprivileged() {
  /bin/rm -rf "$TARGET" || return 1
  /usr/bin/ditto "$SOURCE_APP" "$TARGET" || return 1
  # A missing quarantine attribute makes xattr exit nonzero; the verification
  # below is what decides whether any copy still carries the flag.
  /usr/bin/xattr -dr com.apple.quarantine "$TARGET" 2>/dev/null
  return 0
}

install_privileged() {
  local script_file rc
  script_file="$(mktemp "${TMPDIR:-/tmp}/tomato-install.XXXXXX.sh")" || return 1
  {
    printf '#!/bin/bash\nset -e\n'
    printf '/bin/rm -rf %s\n' "'$TARGET'"
    printf '/usr/bin/ditto %s %s\n' "'$SOURCE_APP'" "'$TARGET'"
    printf '/usr/bin/xattr -dr com.apple.quarantine %s 2>/dev/null || true\n' "'$TARGET'"
  } >"$script_file"
  /usr/bin/osascript -e "do shell script \"/bin/bash '$script_file'\" with administrator privileges" >/dev/null 2>&1
  rc=$?
  rm -f "$script_file"
  return $rc
}

mkdir -p "$INSTALL_DIR" 2>/dev/null || true
say "正在安装到 ${TARGET}…"
if [[ -w "$INSTALL_DIR" ]] && install_unprivileged; then
  :
else
  say "需要管理员权限，请在弹出的系统对话框中输入密码…"
  install_privileged || die "复制应用到 $INSTALL_DIR 失败"
fi

for path in "$TARGET" "$TARGET/Contents/MacOS/$APP_NAME"; do
  if /usr/bin/xattr "$path" 2>/dev/null | /usr/bin/grep -qx 'com.apple.quarantine'; then
    die "仍有文件带下载隔离标记：$path"
  fi
done

verify_signature || die "应用签名校验失败，安装包可能已损坏或不完整（上方为校验器输出，请连同系统版本一起发回）"

say "安装完成：$TARGET"
say "下载隔离标记已清除，首次启动不会再被 Gatekeeper 拦截。"
pause_if_interactive