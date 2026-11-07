#!/usr/bin/env bash
# Restaura um backup .sql.gz no MySQL do Compose. SUBSTITUI os dados atuais do banco.
# Uso: scripts/restaurar-banco.sh backups/painel-<ambiente>-AAAAMMDD-HHMMSS.sql.gz
#      AMBIENTE=producao scripts/restaurar-banco.sh <arquivo>   (banco de produção)
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/_compose.sh
[ $# -eq 1 ] && [ -f "$1" ] || { echo "Uso: $0 arquivo.sql.gz" >&2; exit 2; }
read -r -p "Isto vai SOBRESCREVER o banco de ${AMBIENTE:-desenvolvimento} com '$1'. Digite 'sim' para continuar: " R
[ "$R" = "sim" ] || { echo "Cancelado."; exit 1; }
"${COMPOSE[@]}" stop backend
"${COMPOSE[@]}" exec -T db sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "DROP DATABASE IF EXISTS \`$MYSQL_DATABASE\`; CREATE DATABASE \`$MYSQL_DATABASE\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"'
gunzip -c "$1" | "${COMPOSE[@]}" exec -T db sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" --default-character-set=utf8mb4 "$MYSQL_DATABASE"'
"${COMPOSE[@]}" start backend
echo "Restauração concluída."
