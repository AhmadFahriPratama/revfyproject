# Database Backup Setup Guide

This guide explains how to set up automated database backups for the `revfy` project and send them to a Telegram Bot.

## 1. Prerequisites

Ensure your VPS has the necessary tools installed:

```bash
sudo apt update
sudo apt install mysql-client zip curl
# To use .rar format (optional):
sudo apt install rar
```

## 2. Set up Telegram Bot

1. Message [@BotFather](https://t.me/botfather) on Telegram and create a new bot to get your **Bot Token**.
2. Message [@userinfobot](https://t.me/userinfobot) to get your **Chat ID**.
3. (Optional) Add your bot to a group and get the Group ID if you want backups sent there.

## 3. Configure the Script

Open `scripts/backup_database.sh` and fill in your Telegram credentials, or set them as environment variables:

```bash
export TELEGRAM_BOT_TOKEN="8611371061:AAGg9GbywLeeyYbg-aahZDxWihGe6dB2ehQ"
export TELEGRAM_CHAT_ID="@balrev"
```

> [!NOTE]
> Since you are using a channel/group, the `@balrev` format is correct. Ensure your bot is an **Admin** in that channel/group so it has permission to post files.

The script will automatically try to read database credentials from your `.env` file if it exists in the root directory.

## 4. Make the Script Executable

```bash
chmod +x scripts/backup_database.sh
```

## 5. Test the Backup

Run the script manually to ensure it works:

```bash
./scripts/backup_database.sh
```

Check your Telegram for the `database_revfy.rar` (or `.zip`) file.

## 6. Automate with Cron

To run the backup automatically (e.g., every 6 hours), add a cron job:

1. Open the crontab editor:
   ```bash
   crontab -e
   ```
2. Add the following line (adjust the path to your project):
   ```cron
   0 */6 * * * /bin/bash /path/to/revfy/scripts/backup_database.sh >> /path/to/revfy/backups/backup.log 2>&1
   ```

## Troubleshooting

- **Access Denied**: Ensure the database user has `SELECT` and `LOCK TABLES` permissions.
- **Connection Refused**: Check if `DB_HOST` is correct (use `localhost` or `127.0.0.1` for local DB).
- **Telegram Error**: Double-check your Bot Token and Chat ID.
