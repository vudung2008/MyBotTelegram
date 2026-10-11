const config = {
  name: "update",
  description: "Xử lý cập nhật từ Telegram",
  order: 0,
};

const data = {};

async function execute({ updateType, chat, rawUpdate }) {
  console.log("Received update:", {
    type: updateType,
    chatType: chat?.type,
    update: rawUpdate,
  });
}

module.exports = {
  config,
  data,
  execute,
};