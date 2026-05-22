import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "react-toastify";
import { useAuth } from "./AuthContext";
import { api } from "../helpers/apiClient/apiClient";

type SocketContextType = {
  socket: Socket | null;
  latestPrediction: any | null;
  clearPrediction: () => void;
  inferenceNotificationCount: number;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  latestPrediction: null,
  clearPrediction: () => {},
  inferenceNotificationCount: 0,
});

const BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

const parseBool = (v: string | undefined, defaultVal: boolean) =>
  v === undefined ? defaultVal : v === "true";
const parseNumber = (v: string | undefined, defaultVal: number) => {
  if (v === undefined) return defaultVal;
  const n = Number(v);
  return Number.isFinite(n) ? n : defaultVal;
};

const SOCKET_AUTO_CONNECT = parseBool(
  import.meta.env.VITE_SOCKET_AUTO_CONNECT,
  false,
);
const SOCKET_WITH_CREDENTIALS = parseBool(
  import.meta.env.VITE_SOCKET_WITH_CREDENTIALS,
  true,
);
const SOCKET_RECONNECTION = parseBool(
  import.meta.env.VITE_SOCKET_RECONNECTION,
  true,
);
const SOCKET_RECONNECTION_ATTEMPTS = (() => {
  const v = import.meta.env.VITE_SOCKET_RECONNECTION_ATTEMPTS;
  if (v === undefined) return Infinity;
  const n = Number(v);
  return Number.isFinite(n) ? n : Infinity;
})();
const SOCKET_RECONNECTION_DELAY = parseNumber(
  import.meta.env.VITE_SOCKET_RECONNECTION_DELAY_MS,
  1000,
);
const SOCKET_RECONNECTION_DELAY_MAX = parseNumber(
  import.meta.env.VITE_SOCKET_RECONNECTION_DELAY_MAX_MS,
  5000,
);
const SOCKET_TIMEOUT = parseNumber(
  import.meta.env.VITE_SOCKET_TIMEOUT_MS,
  5 * 60 * 1000,
);

type Props = {
  children: ReactNode;
};

export const SocketProvider = ({ children }: Props) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [latestPrediction, setLatestPrediction] = useState<any | null>(null);
  //Trigger for frontend History page.
  const [inferenceNotificationCount, setInferenceNotificationCount] =
    useState(0);
  const socketRef = useRef<Socket | null>(null);
  const refreshingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      socketRef.current?.removeAllListeners();
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      return;
    }

    if (socketRef.current) {
      setSocket(socketRef.current);
      if (!socketRef.current.connected) {
        socketRef.current.connect();
      }
      return;
    }

    const socket = io(BACKEND_URL, {
      autoConnect: SOCKET_AUTO_CONNECT,
      withCredentials: SOCKET_WITH_CREDENTIALS,
      reconnection: SOCKET_RECONNECTION,
      reconnectionAttempts: SOCKET_RECONNECTION_ATTEMPTS,
      reconnectionDelay: SOCKET_RECONNECTION_DELAY,
      reconnectionDelayMax: SOCKET_RECONNECTION_DELAY_MAX,
      timeout: SOCKET_TIMEOUT,
    });

    socketRef.current = socket;
    setSocket(socket);

    socket.on("connect", () => {
      console.log("Connected to Socket.IO server with ID:", socket.id);
    });

    socket.on("connect_error", async (err) => {
      console.error("Connection error:", err);

      const message = String((err as Error)?.message || "").toLowerCase();
      if (refreshingRef.current || !message.includes("authentication error")) {
        return;
      }

      refreshingRef.current = true;
      try {
        await api.post("/auth/refresh");
        if (!socket.connected) {
          socket.connect();
        }
      } catch (refreshError) {
        console.error("Socket auth refresh failed:", refreshError);
      } finally {
        refreshingRef.current = false;
      }
    });

    socket.on("prediction_complete", (data: any) => {
      console.log("Global Socket received prediction_complete:", data);
      setLatestPrediction(data);
      if (data.status === "success") {
        toast.success("Prediction completed successfully!");
      } else {
        toast.error(data.message || "An error occurred during prediction.");
      }
      setInferenceNotificationCount((count) => count + 1);
    });

    socket.on("disconnect", (reason) => {
      console.log("Disconnected from Socket.IO server. Reason:", reason);
    });

    socket.connect();

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, user]);

  const clearPrediction = useCallback(() => {
    setLatestPrediction(null);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        latestPrediction,
        clearPrediction,
        inferenceNotificationCount,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
