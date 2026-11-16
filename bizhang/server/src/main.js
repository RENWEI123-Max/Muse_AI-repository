import { evaluateAlerts } from './alerts.js';
import { BotTransport, TelegramWorker, TelegramPoller } from './telegram.js';
import { Market } from "./market.js";
import { pool } from "./db.js";
import { buildApp } from "./app.js";
const port = Number(process.env.PORT ?? 3100);
if (
  !Number.isInteger(port) ||
  port < 1024 ||
  port > 65535 ||
  [3000, 8080, 8081, 8082].includes(port)
)
  throw Error("Invalid or prohibited port");
const market = new Market(pool, { afterBinance: () => evaluateAlerts(pool) });
const transport = new BotTransport();
const worker = new TelegramWorker(pool, transport);
const poller = new TelegramPoller(pool, transport);
const app = await buildApp(pool, market);
await pool.query("SELECT 1");
await app.listen({ host: "127.0.0.1", port });
await market.start();
if (process.env.BIZHANG_TELEGRAM_BOT_TOKEN) { void worker.run(); void poller.run(); }
console.log(`BiZhang listening on 127.0.0.1:${port}`);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    market.stop();
    worker.stop();
    poller.stop();
    await app.close();
    await pool.end();
    process.exit(0);
  });
