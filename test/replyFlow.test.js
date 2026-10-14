const test = require("node:test");
const assert = require("node:assert/strict");
const { createReplyFlow } = require("../src/replyFlow");

function createContext(overrides = {}) {
  return {
    chat: { id: 42 },
    from: { id: 7 },
    message: { text: "https://www.tiktok.com/@demo/video/123" },
    reply: async () => ({ message_id: 100 }),
    ...overrides,
  };
}

test("handles one reply for the user and chat that requested it", async () => {
  const flow = createReplyFlow();
  const received = [];
  const context = createContext();

  await flow.request({
    ctx: context,
    chatId: context.chat.id,
    userId: context.from.id,
    prompt: "Reply with a TikTok link",
    handler: async ({ text }) => received.push(text),
  });

  const handled = await flow.handle(
    createContext({
      message: {
        text: context.message.text,
        reply_to_message: { message_id: 100 },
      },
    }),
  );
  const handledAgain = await flow.handle(context);

  assert.equal(handled, true);
  assert.equal(handledAgain, false);
  assert.deepEqual(received, [context.message.text]);
});

test("does not consume a reply from another user or chat", async () => {
  const flow = createReplyFlow();
  const handler = async () => {
    throw new Error("wrong context consumed the reply");
  };

  await flow.request({
    ctx: createContext(),
    chatId: 42,
    userId: 7,
    prompt: "Reply with a TikTok link",
    handler,
  });

  const handled = await flow.handle(
    createContext({ chat: { id: 99 }, from: { id: 8 } }),
  );

  assert.equal(handled, false);
});
