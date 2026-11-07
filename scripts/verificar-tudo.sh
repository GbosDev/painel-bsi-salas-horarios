#!/usr/bin/env bash
# Roda as verificações automáticas que não exigem Docker: front (tipos, lint, formato, testes, build),
# testes do importador e (se houver rede para o Maven Central) o `./mvnw verify` do backend.
# Uso: scripts/verificar-tudo.sh [--sem-backend]
set -euo pipefail
cd "$(dirname "$0")/.."
echo "== Frontend =="
( cd frontend && npm ci --no-audit --no-fund && npm run typecheck && npm run lint && npm run format && npm test && npm run build )
echo "== Importador =="
( cd banco-de-dados/ferramentas && npm ci --no-audit --no-fund && npm test )
if [ "${1:-}" != "--sem-backend" ]; then
  echo "== Backend (o teste com Testcontainers exige Docker) =="
  ( cd backend && ./mvnw -B verify )
fi
echo "Tudo verificado."
