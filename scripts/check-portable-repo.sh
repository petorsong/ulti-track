#!/usr/bin/env bash
# Ensures npm config stays on the public registry (no private mirrors in lockfiles).
set -euo pipefail

fail() {
  echo "$1" >&2
  exit 1
}

if [[ -f package-lock.json ]]; then
  if grep '"resolved"' package-lock.json | grep -v 'https://registry.npmjs.org/' | grep -q .; then
    fail 'package-lock.json must only use https://registry.npmjs.org/ resolved URLs (see AGENTS.md).'
  fi
fi

if [[ -f .npmrc ]]; then
  if grep -E '^@[^=]+:registry=' .npmrc | grep -q .; then
    fail '.npmrc must not set scoped private registries (see AGENTS.md).'
  fi
  if grep -E '^registry=' .npmrc | grep -v 'registry.npmjs.org' | grep -q .; then
    fail '.npmrc registry must be https://registry.npmjs.org/ (see AGENTS.md).'
  fi
fi

if [[ -f package.json ]]; then
  if grep -E '"(file|link):' package.json | grep -q .; then
    fail 'package.json must not use file: or link: dependencies (see AGENTS.md).'
  fi
  if grep -E 'git\+ssh|git@' package.json | grep -q .; then
    fail 'package.json must not use private git dependencies (see AGENTS.md).'
  fi
fi

echo 'Portable repo check passed.'
