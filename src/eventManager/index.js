const fs = require("fs");
const path = require("path");
const logger = require("../logger");

const eventsDirectory = __dirname;
const TELEGRAM_UPDATE_TYPES = [
  "message",
  "edited_message",
  "channel_post",
  "edited_channel_post",
  "business_connection",
  "business_message",
  "edited_business_message",
  "deleted_business_messages",
  "message_reaction",
  "message_reaction_count",
  "inline_query",
  "chosen_inline_result",
  "callback_query",
  "shipping_query",
  "pre_checkout_query",
  "purchased_paid_media",
  "poll",
  "poll_answer",
  "my_chat_member",
  "chat_member",
  "chat_join_request",
  "chat_boost",
  "removed_chat_boost",
];

function loadEvents() {
  return fs
    .readdirSync(eventsDirectory, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".js") &&
        entry.name !== "index.js",
    )
    .map((entry) => require(path.join(eventsDirectory, entry.name)))
    .sort(
      (first, second) =>
        (first.config.order || 0) - (second.config.order || 0),
    );
}

function validateEvent(event) {
  if (
    !event.config ||
    typeof event.config.name !== "string" ||
    (event.config.type !== undefined &&
      typeof event.config.type !== "string") ||
    typeof event.config.description !== "string" ||
    typeof event.execute !== "function"
  ) {
    throw new Error(`Event không hợp lệ: ${JSON.stringify(event)}`);
  }
}

function getEventPayload(ctx, eventType) {
  if (!eventType || eventType === "update") {
    return ctx.update;
  }

  return ctx.update?.[eventType];
}

function getUpdateType(update) {
  return Object.keys(update || {}).find((key) => key !== "update_id");
}

function createEventContext(ctx, event) {
  const { config, data = {} } = event;
  const payload = getEventPayload(ctx, config.type);
  const updateType = config.type || getUpdateType(ctx.update);
  const user = ctx.from || payload?.from || payload?.user;

  return {
    ctx,
    bot: ctx.botInfo,
    botInfo: ctx.botInfo,
    telegram: ctx.telegram,
    update: ctx.update,
    rawUpdate: ctx.update,
    event: config,
    eventName: config.name,
    eventType: updateType,
    type: updateType,
    updateType,
    data,
    payload,
    message: ctx.message || payload,
    chat: ctx.chat || payload?.chat,
    state: ctx.state,
    session: ctx.session,
    match: ctx.match,
    user: {
      id: user?.id,
      isBot: user?.is_bot || false,
      firstName: user?.first_name || "",
      lastName: user?.last_name || "",
      username: user?.username || "",
      languageCode: user?.language_code,
    },
    reply: (text, extra) => ctx.reply(text, extra),
    answerCallbackQuery: (text, extra) =>
      ctx.answerCbQuery ? ctx.answerCbQuery(text, extra) : undefined,
  };
}

function createEventHandler(event) {
  return async (ctx, next) => {
    const { config, execute } = event;
    try {
      const eventContext = createEventContext(ctx, event);
      const result = await execute(eventContext);

      if (typeof result === "string") {
        await eventContext.reply(result);
      } else if (result?.text) {
        await eventContext.reply(result.text, result.extra);
      }

      logger.info(`Đã xử lý event ${config.name}`, {
        type: eventContext.updateType,
        chatType: eventContext.chat?.type,
        userId: ctx.from?.id,
      });
    } catch (error) {
      logger.error(`Event ${config.name} thất bại`, {
        error: error.message,
        userId: ctx.from?.id,
      });
    }

    if (next) {
      await next();
    }
  };
}

function registerEvents(bot, options = {}) {
  const allEvents = loadEvents();
  const events = allEvents.filter(({ config }) => {
    if (options.only) {
      return (
        (!config.type && options.only.includes("update")) ||
        options.only.includes(config.type)
      );
    }

    if (options.exclude) {
      return config.type && !options.exclude.includes(config.type);
    }

    return true;
  });
  events.forEach(validateEvent);

  for (const event of events) {
    const handler = createEventHandler(event);

    if (!event.config.type) {
      bot.use(handler);
    } else if (event.config.type === "update") {
      bot.use(handler);
    } else if (event.config.once) {
      bot.once(event.config.type, handler);
    } else {
      bot.on(event.config.type, handler);
    }
  }

  logger.info(`Đã đăng ký ${events.length} event`, {
    events: events.map(({ config }) => `${config.name}:${config.type || "*"}`),
  });

  return events;
}

module.exports = {
  TELEGRAM_UPDATE_TYPES,
  loadEvents,
  createEventContext,
  createEventHandler,
  registerEvents,
};
