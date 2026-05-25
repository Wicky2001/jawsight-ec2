import axios from "axios";

// --- API Client Setup ---
const BASE_URL =
  `${import.meta.env.VITE_API_BASE_URL}/api` || "http://localhost:8081/api";
const currentPath = window.location.pathname;
const traceHeaderName = "X-Amzn-Trace-Id";
const isXrayHeaderEnabled = import.meta.env.VITE_XRAY_ENABLED === "true";

const randomHex = (length: number) => {
  const byteLength = Math.ceil(length / 2);
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, length);
};

const createTraceHeaderValue = () => {
  const epochHex = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, "0");

  return `Root=1-${epochHex}-${randomHex(24)};Sampled=1`;
};

const client = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

const attachTraceHeader = (config: any) => {
  if (!isXrayHeaderEnabled) {
    return config;
  }

  const headers = config.headers || {};

  if (!headers[traceHeaderName] && !headers[traceHeaderName.toLowerCase()]) {
    headers[traceHeaderName] = createTraceHeaderValue();
  }

  config.headers = headers;
  return config;
};

client.interceptors.request.use(attachTraceHeader);
refreshClient.interceptors.request.use(attachTraceHeader);

client.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await refreshClient.post("/auth/refresh");

        return client(originalRequest);
      } catch (refreshError: any) {
        if (refreshError.response?.status === 401) {
          window.location.href = `/login?from=${encodeURIComponent(currentPath)}`;
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export const api = {
  get: (endpoint: string, queryParams?: any, config?: any) =>
    client.get(endpoint, { params: queryParams, ...config }),

  post: (endpoint: string, body?: any, config?: any) =>
    client.post(endpoint, body, config),

  put: (endpoint: string, body?: any, config?: any) =>
    client.put(endpoint, body, config),

  patch: (endpoint: string, body?: any, config?: any) =>
    client.patch(endpoint, body, config),

  delete: (endpoint: string, body?: any, config?: any) =>
    client.delete(endpoint, { data: body, ...config }),
};
