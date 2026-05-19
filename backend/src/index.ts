import "dotenv/config";
import db from "./sequelize_models/index.js";
import http from "http";
import app from "./app.js";
import { initializeSocket } from "./helpers/socket.helper.js";

const PORT = process.env.PORT || 8081;

const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    console.log("Database synced (force: true)");

    const server = http.createServer(app);
    const io = initializeSocket(server);

    app.set("socketio", io);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error during server initialization:", error);
  }
};

startServer();
