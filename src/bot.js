const { Telegraf } = require("telegraf");
const {
  registerCommands,
  registerTelegramCommands,
} = require("./commandManager");
const {
  TELEGRAM_UPDATE_TYPES,
  loadEvents,
  registerEvents,
} = require("./eventManager");
const logger = require("./logger");
const { createReplyFlow } = require("./replyFlow");

function createBot(token) {
  const bot = new Telegraf(token);
  const replyFlow = createReplyFlow();
  const eventDefinitions = loadEvents();
  replyFlow.register(bot);
  const updateEvents = registerEvents(bot, {
    events: eventDefinitions,
    only: ["update"],
  });
  const commands = registerCommands(bot, {
    events: eventDefinitions,
    replyFlow,
  });
  const events = registerEvents(bot, {
    events: eventDefinitions,
    exclude: ["update"],
  });

  bot.catch((error) => {
    logger.error("Lỗi xử lý update", { error: error.message });
  });

  return {
    bot,
    commands,
    events: [...updateEvents, ...events],
    allowedUpdates: TELEGRAM_UPDATE_TYPES,
    replyFlow,
  };
}

module.exports = { createBot, registerTelegramCommands };
