function getReplyKey(chatId, userId) {
  return `${chatId}:${userId}`;
}

function createReplyFlow() {
  const pendingReplies = new Map();

  async function request({ ctx, chatId, userId, prompt, handler }) {
    if (!ctx?.reply || chatId === undefined || userId === undefined) {
      throw new Error("Không thể đăng ký reply nếu thiếu context người dùng.");
    }

    if (typeof handler !== "function") {
      throw new Error("Reply handler phải là một function.");
    }

    const promptMessage = await ctx.reply(prompt);
    pendingReplies.set(getReplyKey(chatId, userId), {
      handler,
      promptMessageId: promptMessage?.message_id,
    });
  }

  async function handle(ctx) {
    const chatId = ctx.chat?.id;
    const userId = ctx.from?.id;
    const message = ctx.message;
    const pendingReply = pendingReplies.get(getReplyKey(chatId, userId));

    if (
      !pendingReply ||
      message?.reply_to_message?.message_id !== pendingReply.promptMessageId
    ) {
      return false;
    }

    pendingReplies.delete(getReplyKey(chatId, userId));
    await pendingReply.handler({ text: message.text || "", ctx });
    return true;
  }

  function register(bot) {
    bot.on("text", async (ctx, next) => {
      const handled = await handle(ctx);

      if (!handled && next) {
        await next();
      }
    });
  }

  return { request, handle, register };
}

module.exports = { createReplyFlow };