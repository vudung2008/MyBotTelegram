const config = {
  name: "help",
  description: "Hiển thị trợ giúp",
  order: 2,
  usage: "/help",
};

const data = {};

function execute({ commands }) {
  return commands;
}

module.exports = { config, data, execute };
