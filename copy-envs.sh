#!/usr/bin/env sh
set -eu

FORCE=0
if [ "${1:-}" = "--force" ] || [ "${1:-}" = "-f" ]; then
  FORCE=1
fi

find . -type f \( -name 'env.example' -o -name '.env.example' \) | sort | while IFS= read -r example; do
  case "$example" in
    */.env.example) target="$(dirname "$example")/.env" ;;
    */env.example) target="$(dirname "$example")/.env" ;;
    *) continue ;;
  esac

  if [ "$FORCE" -eq 0 ] && [ -f "$target" ]; then
    printf 'skip  %s (already exists)\n' "$target"
    continue
  fi

  cp "$example" "$target"
  printf 'copy  %s -> %s\n' "$example" "$target"
done
