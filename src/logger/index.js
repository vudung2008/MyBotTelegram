const levels = {
  INFO: { label: "INFO", color: "\x1b[36m" },
  WARN: { label: "WARN", color: "\x1b[33m" },
  ERROR: { label: "ERROR", color: "\x1b[31m" },
};

const resetColor = "\x1b[0m";

function write(level, message, metadata) {
  const { label, color } = levels[level];
  const timestamp = new Date().toISOString();
  const suffix = metadata ? ` ${JSON.stringify(metadata)}` : "";
  const output = `${color}[${timestamp}] [${label}]${resetColor} ${message}${suffix}`;

  if (level === "ERROR") {
    console.error(output);
    return;
  }

  if (level === "WARN") {
    console.warn(output);
    return;
  }

  console.info(output);
}

module.exports = {
  info: (message, metadata) => write("INFO", message, metadata),
  warn: (message, metadata) => write("WARN", message, metadata),
  error: (message, metadata) => write("ERROR", message, metadata),
};
