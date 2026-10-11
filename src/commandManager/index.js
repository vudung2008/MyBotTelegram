const fs = require("fs");
const path = require("path");
const logger = require("../logger");

const commandsDirectory = __dirname;

function formatUsage(config, type) {
  if (!config.usage) {
    return "";
  }

  const usages = config.usage
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (type === "command" && !part.startsWith("/")) {
        return `/${config.name} ${part}`;
      }

      return part;
    });

  return usages.length > 1 ? usages.join(" hoặc ") : usages[0];
}

function loadCommands() {
  return fs
    .readdirSync(commandsDirectory, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".js") &&
        entry.name !== "index.js",
    )
    .map((entry) => require(path.join(commandsDirectory, entry.name)))
    .sort((first, second) => (first.config.order || 0) - (second.config.order || 0));
}

function validateCommand(command) {
  const { config, execute } = command;

  if (
    !config ||
    !/^[a-z0-9_]{1,32}$/i.test(config.name || "") ||
    !config.description ||
    typeof execute !== "function"
  ) {
    throw new Error(`Command không hợp lệ: ${JSON.stringify(command)}`);
  }
}

function parseArguments(text, commandName) {
  const input = text.replace(new RegExp(`^/${commandName}(?:@\\S+)?\\s*`, "i"), "");
  const tokens = input.match(/"[^"]*"|'[^']*'|\S+/g) || [];
  const args = [];
  const flags = {};

  for (const token of tokens) {
    const value = token.replace(/^["']|["']$/g, "");

    if (value.startsWith("--")) {
      const [key, ...parts] = value.slice(2).split("=");
      flags[key] = parts.length ? parts.join("=") : true;
      continue;
    }

    args.push(value);
  }

  return { args, flags, rawArgs: input.trim() };
}

async function executeCommand(ctx, command, commandList) {
  const { config, data = {}, execute } = command;
  const parsed = parseArguments(ctx.message.text, config.name);
  const result = await execute({
    ...parsed,
    data,
    command: config,
    commands: commandList,
    user: {
      id: ctx.from?.id,
      firstName: ctx.from?.first_name || "",
      lastName: ctx.from?.last_name || "",
      username: ctx.from?.username || "",
    },
  });

  if (typeof result === "string") {
    await ctx.reply(result);
  }

  logger.info(`Đã thực thi /${config.name}`, {
    userId: ctx.from?.id,
    args: parsed.args,
    flags: parsed.flags,
  });
}

function registerCommands(bot, options = {}) {
  const commands = loadCommands();
  commands.forEach(validateCommand);

  const commandHelp = commands
    .map(({ config }) => {
      const usage = formatUsage(config, "command");
      const usageLine = usage ? `\n  Dùng: ${usage}` : "";
      return `/${config.name} - ${config.description}${usageLine}`;
    })
    .join("\n");
  const eventHelp = (options.events || [])
    .map(({ config }) => {
      const eventType = config.type || "all updates";
      const usage = formatUsage(config, "event");
      const usageLine = usage ? `\n  Dùng: ${usage}` : "";
      return `${config.name} [${eventType}] - ${config.description}${usageLine}`;
    })
    .join("\n");
  const commandList = [
    "Commands:",
    commandHelp,
    eventHelp ? `\nEvents:\n${eventHelp}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  for (const command of commands) {
    const { config } = command;

    bot.command(config.name, async (ctx) => {
      try {
        await executeCommand(ctx, command, commandList);
      } catch (error) {
        logger.error(`Command /${config.name} thất bại`, {
          error: error.message,
          userId: ctx.from?.id,
        });
        await ctx.reply("Đã xảy ra lỗi khi thực hiện lệnh.");
      }
    });
  }

  logger.info(`Đã đăng ký ${commands.length} command`, {
    commands: commands.map(({ config }) => `/${config.name}`),
  });

  return commands;
}

async function registerTelegramCommands(bot, commands) {
  await bot.telegram.setMyCommands(
    commands.map(({ config }) => ({
      command: config.name,
      description: config.description,
    })),
  );
  logger.info("Đã đồng bộ menu slash command với Telegram");
}

module.exports = {
  loadCommands,
  executeCommand,
  registerCommands,
  registerTelegramCommands,
};
