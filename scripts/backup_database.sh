#!/bin/bash

# Configuration
# Load from .env if it exists in the parent directory
if [ -f "../.env" ]; then
    export $(grep -v '^#' ../.env | xargs)
fi

# Database Settings (Fallback to defaults if not in .env)
DB_USER=${DB_USER:-"revfy_user"}
DB_PASSWORD=${DB_PASSWORD:-"your_strong_password"}
DB_NAME=${DB_NAME:-"revfy_app"}
DB_HOST=${DB_HOST:-"127.0.0.1"}

# Telegram Settings
TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN:-"8611371061:AAGg9GbywLeeyYbg-aahZDxWihGe6dB2ehQ"}
TELEGRAM_CHAT_ID=${TELEGRAM_CHAT_ID:-"6198959866"}

# Backup Settings
BACKUP_DIR="./backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
DUMP_FILE="database_revfy_${DATE}.sql"
RAR_FILE="database_revfy.rar"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "Starting database backup for ${DB_NAME}..."

# 1. Perform MySQL Dump
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > "$BACKUP_DIR/$DUMP_FILE"

if [ $? -eq 0 ]; then
    echo "Database dump successful: $DUMP_FILE"
else
    echo "Error: Database dump failed!"
    exit 1
fi

# 2. Compress the backup
# Check if rar is installed, otherwise use zip
if command -v rar &> /dev/null; then
    echo "Compressing with RAR..."
    rar a "$BACKUP_DIR/$RAR_FILE" "$BACKUP_DIR/$DUMP_FILE"
    COMPRESSED_FILE="$BACKUP_DIR/$RAR_FILE"
else
    echo "RAR not found. Compressing with ZIP..."
    zip -j "$BACKUP_DIR/database_revfy.zip" "$BACKUP_DIR/$DUMP_FILE"
    COMPRESSED_FILE="$BACKUP_DIR/database_revfy.zip"
fi

# 3. Send via Telegram Bot
echo "Sending backup to Telegram..."
curl -F document=@"$COMPRESSED_FILE" \
     -F caption="📦 Database Backup: ${DATE}" \
     "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument?chat_id=${TELEGRAM_CHAT_ID}"

if [ $? -eq 0 ]; then
    echo "Backup sent successfully to Telegram!"
else
    echo "Error: Failed to send backup to Telegram!"
fi

# 4. Self-Installation (Optional)
if [[ "$1" == "--install" ]]; then
    echo "Installing Cron Job (runs every 6 hours)..."
    (crontab -l 2>/dev/null; echo "0 */6 * * * /bin/bash $(pwd)/backup_database.sh >> $(pwd)/../backups/backup.log 2>&1") | crontab -
    echo "Cron Job installed successfully!"
fi

echo "Backup process completed."
