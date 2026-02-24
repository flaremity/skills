#!/usr/bin/env bash
# Check the latest version of @anthropic-ai/claude-agent-sdk on npm
# Usage: ./check-versions.sh

set -euo pipefail

PACKAGE="@anthropic-ai/claude-agent-sdk"
CURRENT="0.2.52"

echo "Checking latest version of ${PACKAGE}..."

LATEST=$(npm view "${PACKAGE}" version 2>/dev/null || echo "unknown")

echo ""
echo "  Skill references: v${CURRENT}"
echo "  Latest on npm:    v${LATEST}"
echo ""

if [ "${LATEST}" = "unknown" ]; then
  echo "⚠ Could not fetch latest version. Check your network connection."
  exit 1
elif [ "${LATEST}" = "${CURRENT}" ]; then
  echo "✓ Skill is up to date."
else
  echo "⚠ Skill may need updating. Check changelog:"
  echo "  https://www.npmjs.com/package/${PACKAGE}?activeTab=versions"
fi
