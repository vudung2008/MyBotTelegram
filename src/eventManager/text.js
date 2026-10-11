const config = {
  name: "text",
  type: "text",
  description: "Xử lý tin nhắn dạng text",
  order: 1,
};

const data = {};

async function execute({ message, reply }) {
  const text = message?.text || "";
  if (text) {
    await reply(`Bạn đã gửi tin nhắn: ${text}`, {
        reply_to_message_id: message.message_id,
    });
  }
}

module.exports = {
  config,
  data,
  execute,
};