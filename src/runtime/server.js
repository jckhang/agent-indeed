import { createServer } from "node:http";
import { createApp } from "./app.js";
import { loadRuntimeConfig } from "./config.js";

const config = loadRuntimeConfig();
const app = createApp({ config });
const server = createServer(app);

function closeServer(signal) {
  console.log(`${signal} received, shutting down ${config.serviceName}`);
  server.close(() => {
    process.exit(0);
  });
}

server.on("error", (error) => {
  console.error(`Failed to start ${config.serviceName}:`, error);
  process.exit(1);
});

server.listen(config.port, config.host, () => {
  console.log(
    `${config.serviceName} listening on http://${config.host}:${config.port}`
  );
});

process.on("SIGINT", () => closeServer("SIGINT"));
process.on("SIGTERM", () => closeServer("SIGTERM"));
