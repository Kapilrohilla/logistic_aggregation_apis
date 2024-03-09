import envConfig from "./config";

const log = (...props: LogP) => {
  if (envConfig.NODE_ENV === "DEVELOPMENT") {
    console.log(...props);
  }
};

const warn = (...props: LogP) => {
  if (envConfig.NODE_ENV === "DEVELOPMENT") {
    console.warn(...props);
  }
};

const err = (...props: LogP) => {
  if (envConfig.NODE_ENV === "DEVELOPMENT") {
    console.error(...props);
  }
};

const Logger = { log, warn, err };
export default Logger;
type LogP = any[];
