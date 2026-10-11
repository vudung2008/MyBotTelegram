require("dotenv").config();

function getConfig() {
  const botToken = process.env.BOT_TOKEN;

  if (!botToken) {
    throw new Error("Thiếu biến môi trường BOT_TOKEN.");
  }

  return { botToken };
}

module.exports = { getConfig };
