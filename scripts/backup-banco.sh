#!/usr/bin/env bash
# Backup lógico do MySQL do Compose para um arquivo .sql.gz (consistente, sem parar a aplicação).
# Uso: scripts/backup-banco.sh [diretório-de-destino]   (padrão: ./backups)
#      AMBIENTE=producao scripts/backup-banco.sh       (banco de produção)
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/_compose.sh
DESTINO="${1:-./backups}"
mkdir -p "$DESTINO"
ARQ="$DESTINO/painel-${AMBIENTE:-desenvolvimento}-$(date +%Y%m%d-%H%M%S).sql.gz"
# A senha do root é lida DENTRO do contêiner (variável de ambiente dele); não aparece na linha de comando do host.
"${COMPOSE[@]}" exec -T db sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --default-character-set=utf8mb4 "$MYSQL_DATABASE"' | gzip > "$ARQ"
echo "Backup gravado em $ARQ ($(du -h "$ARQ" | cut -f1))"
