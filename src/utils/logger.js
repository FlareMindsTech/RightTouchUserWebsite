const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  log: (...args) => {
    if (!isProduction) console.log(...args);
  },
  debug: (...args) => {
    if (!isProduction) console.debug(...args);
  },
  info: (...args) => {
    if (!isProduction) console.info(...args);
  },
  warn: (...args) => {
    if (!isProduction) console.warn(...args);
  },
  error: (...args) => {
    if (!isProduction) {
      console.error(...args);
    } else {
      // In production, keep console clean from noisy dumps and sensitive payloads
      const firstArg = args[0];
      const message = typeof firstArg === 'string' ? firstArg : (firstArg?.message || 'Application error');
      console.error(`[Error] ${message}`);
    }
  }
};
