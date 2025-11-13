#!/usr/bin/env bash
set -euo pipefail

DUMP_FILE=${1:?"Uso: restore-database.sh <archivo.dump>"}

read -p "Confirma que está restaurando en ambiente correcto (si/no): " ANSWER
if [[ "$ANSWER" != "si" ]]; then
  echo "Restauración abortada"
  exit 1
fi

echo "[restore] deteniendo servicio backend"
sudo systemctl stop app-backend.service || true

echo "[restore] restaurando $DUMP_FILE"
pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" "$DUMP_FILE"

echo "[restore] aplicando migraciones"
cd /opt/cenagem/app/cenagem-backend
npm run prisma:migrate deploy

echo "[restore] iniciando servicio"
sudo systemctl start app-backend.service
