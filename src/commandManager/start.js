const config = {
  name: "start",
  description: "Khởi động bot",
  order: 1,
  usage: "/start",
};

const data = {};

function execute({ user }) {
  return `Xin chào ${user.firstName}! Tôi là bot Telegram của bạn.`;
}

module.exports = { config, data, execute };
