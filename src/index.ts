import { z } from 'zod'
import { Bot, GrammyError, HttpError } from 'grammy'
import fs from 'fs';
import path from 'path';

// Environment validation
const schema = z.object({
    BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),
});

const STICKER_DIR = path.join(process.cwd(), 'stickers');

const { BOT_TOKEN } = schema.parse(process.env);

// Initialize bot
const bot = new Bot(BOT_TOKEN);

// Ensure temp directory exists
if (!fs.existsSync(STICKER_DIR)) {
    fs.mkdirSync(STICKER_DIR, { recursive: true });
}

// Handle sticker messages
bot.on('message:sticker', async (ctx) => {
    const sticker = ctx.message.sticker;
    if (!sticker.set_name) {
        await ctx.reply('Please send a sticker from a sticker set.');
        return;
    }

    try {
        // Send initial processing message
        const processingMessage = await ctx.reply('🔄 Processing your sticker pack...');

        // Check if sticker pack is already downloaded
        const outputDir = path.join(STICKER_DIR, sticker.set_name);
        if (fs.existsSync(outputDir)) {
            const files = fs.readdirSync(outputDir);
            if (files.length > 0) {
                await ctx.api.editMessageText(
                    ctx.chat.id,
                    processingMessage.message_id,
                    `ℹ️ Sticker pack "${sticker.set_name}" is already downloaded in your local device!`
                );
                return;
            }
        }

        // Get sticker set information
        const stickerSet = await ctx.api.getStickerSet(sticker.set_name);

        // Create output directory
        fs.mkdirSync(outputDir, { recursive: true });

        // Download stickers sequentially
        for (let i = 0; i < stickerSet.stickers.length; i++) {
            const sticker = stickerSet.stickers[i];
            const stickerFile = await ctx.api.getFile(sticker.file_id);
            const stickerFilePath = stickerFile.file_path;
            if (!stickerFilePath) continue;

            const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${stickerFile.file_path}`;
            const response = await fetch(fileUrl);
            const buffer = Buffer.from(await response.arrayBuffer());

            const ext = path.extname(stickerFilePath);
            const fileName = `${sticker.set_name}_${i}${ext}`;
            const filePath = path.join(outputDir, fileName);
            
            // Save file to disk
            fs.writeFileSync(filePath, buffer);

            // Update progress
            if ((i + 1) % 5 === 0 || i === stickerSet.stickers.length - 1) {
                await ctx.api.editMessageText(
                    ctx.chat.id,
                    processingMessage.message_id,
                    `🔄 Downloading "${sticker.set_name}"...\nDownloaded ${i + 1}/${stickerSet.stickers.length} stickers`
                );
            }
        }

        // Send completion message
        await ctx.api.editMessageText(
            ctx.chat.id,
            processingMessage.message_id,
            `✅ Sticker pack "${sticker.set_name}" has been downloaded to your local device!`
        );

    } catch (error) {
        console.error('Error processing sticker:', error);
        await ctx.reply('❌ An error occurred while processing your sticker pack. Please try again later.');
    }
});

bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
      console.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
      console.error("Could not contact Telegram:", e);
    } else {
      console.error("Unknown error:", e);
    }
});

async function stop(){
    console.log('Bot is stopping...');
    await bot.stop()
    process.exit(0);
}
process.once("SIGINT", () => stop());
process.once("SIGTERM", () => stop());

// Start the bot
console.log('Bot is starting...');
bot.start();