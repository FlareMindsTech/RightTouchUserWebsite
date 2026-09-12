const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  log: (...args) => {
    if (!isProduction) console.log(...args);
  },
  debug: (...args) => {
    if (!isProduction) console.debug(...args);
  }
};
