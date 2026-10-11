const config = {
  name: "ping",
  description: "Kiểm tra bot",
  order: 3,
  usage: "/ping [nội dung] [--detail]",
};

const data = {
  defaultResponse: "Pong!",
};

function execute({ args, flags, data: { defaultResponse } }) {
  const suffix = args.length ? ` ${args.join(" ")}` : "";
  const detail = flags.detail ? " (online)" : "";

  return `${defaultResponse}${suffix}${detail}`;
}

module.exports = { config, data, execute };
