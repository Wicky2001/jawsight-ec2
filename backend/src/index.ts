import "dotenv/config";
import db from "./sequelize_models/index.js";
import http from "http";
import app from "./app.js";
import { initializeSocket } from "./helpers/socket.helper.js";

const PORT = process.env.PORT || 8081;

let server: http.Server | null = null;
let io: Awaited<ReturnType<typeof initializeSocket>> | null = null;

const shutdown = (signal: NodeJS.Signals | string) => {
  console.log(`Received ${signal}, shutting down backend...`);

  if (server) {
    server.close((err) => {
      if (err) {
        console.error("Error closing HTTP server:", err);
        process.exit(1);
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

const startServer = async () => {
  try {
    if (process.env.NODE_ENV === "development") {
      await db.sequelize.authenticate();
      console.log("Database synced (force: true)");
    }

    server = http.createServer(app);
    io = await initializeSocket(server);

    app.set("socketio", io);

    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use. Stop the previous backend instance and try again.`,
        );
        process.exit(1);
      }

      console.error("Server error:", error);
      process.exit(1);
    });

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Error during server initialization:", error);
    process.exit(1);
  }
};

startServer();
