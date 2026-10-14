const { downloadTikTokVideo } = require("./tiktokDownloader");

async function handleTikTokReply({ text, ctx }) {
  try {
    const { videoUrl } = await downloadTikTokVideo(text);
    await ctx.replyWithVideo(videoUrl);
  } catch (error) {
    await ctx.reply(`Không thể tải video TikTok: ${error.message}`);
  }
}

module.exports = { handleTikTokReply };
