#!/usr/bin/env bash
# Seleciona o docker compose do ambiente. Uso nos scripts:  source "$(dirname "$0")/_compose.sh"
#   AMBIENTE=desenvolvimento (padrão) → docker-compose.yml + .env
#   AMBIENTE=producao                 → docker-compose.prod.yml + .env.producao
case "${AMBIENTE:-desenvolvimento}" in
  desenvolvimento|dev) COMPOSE=(docker compose) ;;
  producao|prod)
    [ -f .env.producao ] || { echo "Arquivo .env.producao não encontrado (copie de .env.producao.example)." >&2; exit 2; }
    COMPOSE=(docker compose -f docker-compose.prod.yml --env-file .env.producao) ;;
  *) echo "AMBIENTE inválido: '$AMBIENTE' (use desenvolvimento ou producao)." >&2; exit 2 ;;
esac
