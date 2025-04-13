# Telegram Sticker Downloader Bot

A Telegram bot that downloads stickers to your local device when you send them to it.

## Features

- Downloads entire sticker packs when you send any sticker from the pack
- Saves stickers in their original format (WebP, PNG, etc.)
- Shows download progress in real-time
- Organizes stickers by pack name in separate folders

## Usage

1. Create a Telegram bot using [@BotFather](https://t.me/BotFather) and get your bot token
2. Clone the repo
3. Run the bot using Docker:

```bash
docker build -t 
docker run -d \
  -v /path/to/local/stickers:/app/stickers \
  -e BOT_TOKEN=your_bot_token_here \
  telegram-sticker-downloader
```

Replace:
- `/path/to/local/stickers` with the path where you want to save the stickers on your local machine
- `your_bot_token_here` with your actual bot token from BotFather

3. Start a chat with your bot on Telegram
4. Send any sticker from a sticker pack to the bot
5. The bot will download all stickers from that pack and save them in your local folder

## Environment Variables

- `BOT_TOKEN`: Your Telegram bot token (required)