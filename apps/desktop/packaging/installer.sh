#!/bin/bash
#
# Install the adjacent "Tomato AI.app" bundle into /Applications, then remove
# the download quarantine attribute so Gatekeeper does not block the first launch.
#
# Usage:
#   Double-click "Install Tomato AI.command" in this folder, or run:
#     bash installer.sh [path/to/Tomato AI.app]
#
# The application is read from this script's folder; the optional argument names
# another bundle. TOMATO_INSTALL_DIR overrides the destination directory.
#
# This helper does not make an unsigned build suitable for public release; it
# only installs a build the recipient explicitly trusts.

set -u

APP_NAME="Tomato AI"
INSTALL_DIR="${TOMATO_INSTALL_DIR:-/Applications}"
TARGET="$INSTALL_DIR/$APP_NAME.app"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_APP="${1:-$SCRIPT_DIR/$APP_NAME.app}"

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

trap 'exit 130' INT TERM HUP

case "$TARGET" in
  *"'"*|*'"'*) die "安装路径不能包含单引号或双引号" ;;
esac

if [[ $EUID -eq 0 ]]; then
  say "请不要用 sudo（或 root 终端）运行安装脚本，直接双击“Install Tomato AI.command”即可。"
  die "当前以 root 身份运行"
fi

[[ -n "$SOURCE_APP" && -d "$SOURCE_APP" ]] ||
  die "找不到应用：${SOURCE_APP:-$SCRIPT_DIR/$APP_NAME.app}。请先解压整个 zip 包，并让“Install Tomato AI.command”与“$APP_NAME.app”保持在同一目录"
case "$SOURCE_APP" in
  *"'"*|*'"'*) die "应用路径不能包含单引号或双引号，请移动到其他目录后重试" ;;
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
  # Rename the old bundle aside first so a failed copy never leaves a half-removed
  # installation behind, and so the copy never merges into stale files.
  local previous="$TARGET.previous-install"
  /bin/rm -rf "$previous" || return 1
  if [[ -e "$TARGET" ]]; then
    /bin/mv "$TARGET" "$previous" || return 1
  fi
  if ! /usr/bin/ditto "$SOURCE_APP" "$TARGET"; then
    /bin/rm -rf "$TARGET"
    [[ -e "$previous" ]] && /bin/mv "$previous" "$TARGET"
    return 1
  fi
  /bin/rm -rf "$previous"
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
    printf '/bin/rm -rf %s\n' "'${TARGET}.previous-install'"
    printf 'if [ -e %s ]; then /bin/mv %s %s; fi\n' "'$TARGET'" "'$TARGET'" "'${TARGET}.previous-install'"
    printf '/usr/bin/ditto %s %s\n' "'$SOURCE_APP'" "'$TARGET'"
    printf '/bin/rm -rf %s\n' "'${TARGET}.previous-install'"
    printf '/usr/bin/xattr -dr com.apple.quarantine %s 2>/dev/null || true\n' "'$TARGET'"
  } >"$script_file"
  /usr/bin/osascript -e "do shell script \"/bin/bash '$script_file'\" with administrator privileges" >/dev/null 2>&1
  rc=$?
  rm -f "$script_file"
  return $rc
}

say "应用来源：$SOURCE_APP"
mkdir -p "$INSTALL_DIR" 2>/dev/null || true
say "正在安装到 ${TARGET}…"
if [[ -w "$INSTALL_DIR" ]] && install_unprivileged; then
  :
else
  say "需要管理员权限，请在弹出的系统对话框中输入密码…"
  install_privileged || die "复制应用到 $INSTALL_DIR 失败（可能取消了管理员授权）。可设置 TOMATO_INSTALL_DIR 安装到其他目录"
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