const { createBot, registerTelegramCommands } = require("./src/bot");
const { getConfig } = require("./src/config");
const logger = require("./src/logger");

async function start() {
  const { botToken } = getConfig();
  const { bot, commands, allowedUpdates } = createBot(botToken);
  let isStopping = false;

  const stop = (signal) => {
    if (isStopping) {
      return;
    }

    isStopping = true;
    logger.info(`Đang dừng bot (${signal})`);
    bot.stop(signal);
  };

  process.once("SIGINT", () => stop("SIGINT"));
  process.once("SIGTERM", () => stop("SIGTERM"));

  try {
    await registerTelegramCommands(bot, commands);

    const botInfo = await bot.telegram.getMe();
    logger.info(`Kết nối Telegram thành công! Bot username: @${botInfo.username}`);

    if (botInfo.can_read_all_group_messages === false) {
      logger.warn(
        "Privacy Mode đang bật: bot chỉ nhận command, mention và reply trong group. " +
          "Tắt bằng BotFather > /setprivacy > Disable hoặc cấp bot quyền quản trị.",
      );
    }

    logger.info("Bắt đầu lắng nghe updates");
    await bot.launch({
      dropPendingUpdates: true,
      allowedUpdates,
    });
  } catch (error) {
    logger.error("Không thể khởi động bot", { error: error.message });
    stop("STARTUP_ERROR");
    throw error;
  }
}

start().catch(() => {
  process.exitCode = 1;
});
