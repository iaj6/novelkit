#!/usr/bin/env bash
set -euo pipefail

script_path=""
if [[ -n "${BASH_SOURCE[0]:-}" ]]; then
  script_path="${BASH_SOURCE[0]}"
elif [[ -n "${ZSH_VERSION:-}" ]]; then
  # When sourced from zsh, BASH_SOURCE is unset and $0 is "zsh".
  script_path="${(%):-%N}"
else
  script_path="$0"
fi

ROOT="$(cd "$(dirname "$script_path")/.." && pwd)"

env_file="${ENV_FILE:-${1:-$ROOT/.env}}"

if [[ -f "$env_file" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$env_file"
  set +a
fi
