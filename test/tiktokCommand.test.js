const test = require("node:test");
const assert = require("node:assert/strict");
const command = require("../src/commandManager/tiktok");

test("/tiktok registers a reply request instead of handling an event", async () => {
  let registeredRequest;
  const context = {
    ctx: {
      chat: { id: 42 },
      from: { id: 7 },
      reply: async () => ({ message_id: 100 }),
    },
    replyFlow: {
      request: async (request) => {
        registeredRequest = request;
      },
    },
  };

  const result = await command.execute(context);

  assert.equal(result, undefined);
  assert.equal(command.config.name, "tiktok");
  assert.equal(registeredRequest.chatId, 42);
  assert.equal(registeredRequest.userId, 7);
  assert.match(registeredRequest.prompt, /reply.*link TikTok/i);
  assert.equal(typeof registeredRequest.handler, "function");
});
