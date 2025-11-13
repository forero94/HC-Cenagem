#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR=${BACKUP_DIR:-/var/backups/cenagem}
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
OUTPUT="$BACKUP_DIR/cenagem-$TIMESTAMP.dump"
LOG="$BACKUP_DIR/backup-$TIMESTAMP.log"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

echo "[backup] iniciando $TIMESTAMP" | tee -a "$LOG"
pg_dump "$DATABASE_URL" --format=custom --compress=9 --file="$OUTPUT" 2>>"$LOG"
sha256sum "$OUTPUT" >> "$BACKUP_DIR/sha256sums.txt"

echo "[backup] archivo generado: $OUTPUT" | tee -a "$LOG"
