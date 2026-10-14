const { handleTikTokReply } = require("../services/tiktokService");

const config = {
  name: "tiktok",
  description: "Tải video TikTok không watermark",
  order: 4,
  usage: "/tiktok",
};

const data = {};

async function execute({ ctx, replyFlow }) {
  if (!replyFlow) {
    throw new Error("Reply flow chưa được đăng ký.");
  }

  await replyFlow.request({
    ctx,
    chatId: ctx.chat?.id,
    userId: ctx.from?.id,
    prompt: "Hãy reply tin nhắn này bằng link TikTok cần tải.",
    handler: handleTikTokReply,
  });
}

module.exports = { config, data, execute };
