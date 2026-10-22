/**
 * Global configuration and environment helpers for MotionIQ.
 *
 * Centralizes HTTP and WebSocket endpoints across local development,
 * containerized setups, and production environments.
 */

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";

    // In local development where frontend runs on 3000 and FastAPI runs on 8000
    if (isLocalhost && window.location.port === "3000") {
      return `${window.location.protocol}//${hostname}:8000`;
    }

    // In production or reverse-proxy deployments, use same origin without guessing ports
    return window.location.origin;
  }

  return "http://localhost:8000";
}

export const API_BASE_URL = getApiBaseUrl();

export function getWebSocketUrl(endpoint: string, clientId: string): string {
  const cleanEndpoint = endpoint.replace(/^\/+/, "").replace(/\/+$/, "");
  const cleanClientId = encodeURIComponent(clientId);

  if (process.env.NEXT_PUBLIC_WS_URL) {
    const base = process.env.NEXT_PUBLIC_WS_URL.replace(/\/+$/, "");
    return `${base}/api/${cleanEndpoint}/${cleanClientId}`;
  }

  if (typeof window !== "undefined") {
    const isHttps = window.location.protocol === "https:";
    const protocol = isHttps ? "wss:" : "ws:";
    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";

    // Only map port 3000 -> 8000 for local dev loopback
    let port = window.location.port;
    if (isLocalhost && port === "3000") {
      port = "8000";
    }

    const host = port ? `${hostname}:${port}` : hostname;
    return `${protocol}//${host}/api/${cleanEndpoint}/${cleanClientId}`;
  }

  return `ws://localhost:8000/api/${cleanEndpoint}/${cleanClientId}`;
}
