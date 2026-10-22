/**
 * Global configuration and environment helpers for MotionIQ.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getWebSocketUrl(endpoint: string, clientId: string): string {
  const cleanEndpoint = endpoint.replace(/^\/+/, "").replace(/\/+$/, "");
  const cleanClientId = encodeURIComponent(clientId);

  if (process.env.NEXT_PUBLIC_WS_URL) {
    const base = process.env.NEXT_PUBLIC_WS_URL.replace(/\/+$/, "");
    return `${base}/api/${cleanEndpoint}/${cleanClientId}`;
  }

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const hostname = window.location.hostname;
    // In local dev with frontend on 3000, default backend to port 8000
    const port = window.location.port === "3000" ? "8000" : window.location.port;
    const host = port ? `${hostname}:${port}` : hostname;
    return `${protocol}//${host}/api/${cleanEndpoint}/${cleanClientId}`;
  }

  return `ws://localhost:8000/api/${cleanEndpoint}/${cleanClientId}`;
}
