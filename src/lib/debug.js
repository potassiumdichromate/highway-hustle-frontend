const isDev = import.meta.env.DEV;

export const debugLog = (...args) => {
  if (!isDev) return;
  console.log(...args);
};

export const debugWarn = (...args) => {
  if (!isDev) return;
  console.warn(...args);
};

export const debugError = (...args) => {
  if (!isDev) return;
  console.error(...args);
};
