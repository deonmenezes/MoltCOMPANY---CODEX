#!/usr/bin/env bash
set -euo pipefail

PACKAGE="${MOLTCOMPANY_PACKAGE:-moltcompany}"
VERSION="${MOLTCOMPANY_VERSION:-latest}"

if [ "$VERSION" = "latest" ]; then
  TARGET="$PACKAGE"
else
  TARGET="$PACKAGE@$VERSION"
fi

install_with() {
  local manager="$1"
  echo "Installing $TARGET with $manager..."

  case "$manager" in
    bun)
      bun add -g "$TARGET"
      ;;
    pnpm)
      pnpm add -g "$TARGET"
      ;;
    npm)
      npm install -g "$TARGET"
      ;;
    yarn)
      yarn global add "$TARGET"
      ;;
  esac
}

if command -v bun >/dev/null 2>&1; then
  install_with bun
elif command -v pnpm >/dev/null 2>&1; then
  install_with pnpm
elif command -v npm >/dev/null 2>&1; then
  install_with npm
elif command -v yarn >/dev/null 2>&1; then
  install_with yarn
else
  echo "No supported package manager found. Install Node.js or Bun first, then run one of:"
  echo "  npm install -g $TARGET"
  echo "  pnpm add -g $TARGET"
  echo "  yarn global add $TARGET"
  echo "  bun add -g $TARGET"
  exit 1
fi

echo
echo "MoltCompany installed."
echo "Try:"
echo "  moltcompany --help"
echo "  moltcompany prompt --source community --task-id 3 --title \"OpenClaw Intake Desk\" --role \"Agent onboarding operator\""
