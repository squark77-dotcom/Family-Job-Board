import app from "./app";
import { logger } from "./lib/logger";
import { runOverdueJobReminders } from "./routes/family-job-board";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  const reminderInterval = setInterval(() => {
    runOverdueJobReminders().catch((error) => {
      logger.error({ err: error }, "Automatic job reminder run failed");
    });
  }, 15 * 60 * 1000);
  reminderInterval.unref();
});
