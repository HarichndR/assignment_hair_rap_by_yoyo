const { createLogger, format, transports } = require("winston");

const { combine, timestamp, colorize, printf, errors, json } = format;

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack }) => {
    return stack
      ? `[${timestamp}] ${level}: ${message}\n${stack}`
      : `[${timestamp}] ${level}: ${message}`;
  })
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const isDev = process.env.NODE_ENV === "development";

const logger = createLogger({
  level: isDev ? "debug" : "warn",
  format: isDev ? devFormat : prodFormat,
  transports: isDev
    ? [new transports.Console()]
    : [
        new transports.File({ filename: "logs/error.log", level: "error" }),
        new transports.File({ filename: "logs/combined.log" }),
      ],
  exitOnError: false,
});


logger.stream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger;
