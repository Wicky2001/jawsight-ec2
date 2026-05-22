import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "./auth/access.js";
import ApiError from "./ApiError.js";
import { status } from "http-status";
export const doctorSocketMap = new Map<string, string>();

const parseCookies = (cookieString: string) => {
  return cookieString
    .split(";")
    .reduce((res: Record<string, string>, c: string) => {
      const [key, val] = c.trim().split("=").map(decodeURIComponent);
      res[key] = val;
      return res;
    }, {});
};

const whitelist = (process.env.CORS_ORIGINS || "http://localhost:8080")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export function initializeSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: whitelist,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const rawCookie = socket.handshake.headers.cookie;

    if (!rawCookie) {
      return next(
        new ApiError(
          status.UNAUTHORIZED,
          "Authentication error: No cookies found",
        ),
      );
    }

    const cookies = parseCookies(rawCookie);

    const accessToken = cookies["access-token"];

    if (!accessToken) {
      return next(
        new ApiError(
          status.UNAUTHORIZED,
          "Authentication error: Access token missing",
        ),
      );
    }

    const decoded = verifyAccessToken(accessToken);
    if (!decoded || !decoded.id) {
      return next(
        new ApiError(
          status.UNAUTHORIZED,
          "Authentication error: Invalid access token",
        ),
      );
    }

    socket.data.doctorId = decoded.id;
    next();
  });

  io.on("connection", (socket: Socket) => {
    const doctor_id = socket.data.doctorId as string;

    doctorSocketMap.set(doctor_id, socket.id);
    console.log(
      `Doctor ${doctor_id} connected and registered with socket ID ${socket.id}`,
    );

    socket.on("disconnect", () => {
      const currentSocketId = doctorSocketMap.get(doctor_id);
      if (currentSocketId === socket.id) {
        doctorSocketMap.delete(doctor_id);
        console.log(`Doctor ${doctor_id} disconnected.`);
      }
    });
  });

  return io;
}
