import { reportError } from "./errorReporter";

type LogLevel = "info" | "warn" | "error" | "debug";

class Logger {
  private isDev = __DEV__;

  private log(level: LogLevel, message: string, data?: unknown) {
    if (!this.isDev && level === "debug") return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case "info":
        // eslint-disable-next-line no-console
        console.log(prefix, message, data ?? "");
        break;
      case "warn":
        console.warn(prefix, message, data ?? "");
        break;
      case "error":
        this.reportToErrorService(prefix, message, data);
        break;
      case "debug":
        // eslint-disable-next-line no-console
        console.debug(prefix, message, data ?? "");
        break;
    }
  }

  info(message: string, data?: unknown) {
    this.log("info", message, data);
  }

  warn(message: string, data?: unknown) {
    this.log("warn", message, data);
  }

  error(message: string, data?: unknown) {
    this.log("error", message, data);
  }

  debug(message: string, data?: unknown) {
    this.log("debug", message, data);
  }

  private reportToErrorService(prefix: string, message: string, data?: unknown) {
    reportError(new Error(message), { prefix, data });
  }
}

export const logger = new Logger();
