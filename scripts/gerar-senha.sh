#!/usr/bin/env bash
# Gera uma senha aleatória forte (letras e números, 24 caracteres) para usar no .env.
# Uso: scripts/gerar-senha.sh
set -euo pipefail
LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 24; echo
