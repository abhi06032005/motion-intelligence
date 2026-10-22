import { test } from "node:test";
import assert from "node:assert/strict";

function getWebSocketUrl(endpoint, clientId, customWsUrl = null) {
  const cleanEndpoint = endpoint.replace(/^\/+/, "").replace(/\/+$/, "");
  const cleanClientId = encodeURIComponent(clientId);

  if (customWsUrl) {
    const base = customWsUrl.replace(/\/+$/, "");
    return `${base}/api/${cleanEndpoint}/${cleanClientId}`;
  }

  return `ws://localhost:8000/api/${cleanEndpoint}/${cleanClientId}`;
}

test("getWebSocketUrl strips excess slashes and encodes client id", () => {
  const url1 = getWebSocketUrl("/ws/pose/", "client_123");
  assert.equal(url1, "ws://localhost:8000/api/ws/pose/client_123");

  const url2 = getWebSocketUrl("ws/yoga", "client 456");
  assert.equal(url2, "ws://localhost:8000/api/ws/yoga/client%20456");

  const url3 = getWebSocketUrl("/ws/pose", "client_789", "wss://production.motioniq.ai/");
  assert.equal(url3, "wss://production.motioniq.ai/api/ws/pose/client_789");
});
