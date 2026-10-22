import { test } from "node:test";
import assert from "node:assert/strict";

// Setup browser globals
(globalThis as any).window = {
  location: {
    hostname: "localhost",
    port: "3000",
    protocol: "http:",
    origin: "http://localhost:3000",
  },
};

import { getWebSocketUrl, getApiBaseUrl } from "../src/lib/config";

test("getApiBaseUrl maps localhost:3000 to localhost:8000 for local development", () => {
  (globalThis as any).window.location = {
    hostname: "localhost",
    port: "3000",
    protocol: "http:",
    origin: "http://localhost:3000",
  };

  const url = getApiBaseUrl();
  assert.equal(url, "http://localhost:8000");
});

test("getApiBaseUrl does not guess port 8000 in production or non-3000 domains", () => {
  (globalThis as any).window.location = {
    hostname: "motioniq.example.com",
    port: "",
    protocol: "https:",
    origin: "https://motioniq.example.com",
  };

  const url = getApiBaseUrl();
  assert.equal(url, "https://motioniq.example.com");
});

test("getWebSocketUrl strips extra slashes and properly URL-encodes client id", () => {
  (globalThis as any).window.location = {
    hostname: "localhost",
    port: "3000",
    protocol: "http:",
  };

  const url1 = getWebSocketUrl("/ws/pose/", "client_123");
  assert.equal(url1, "ws://localhost:8000/api/ws/pose/client_123");

  const url2 = getWebSocketUrl("ws/yoga", "client 456 & 789");
  assert.equal(url2, "ws://localhost:8000/api/ws/yoga/client%20456%20%26%20789");
});

test("getWebSocketUrl uses secure wss: on https: origins", () => {
  (globalThis as any).window.location = {
    hostname: "motioniq.example.com",
    port: "",
    protocol: "https:",
  };

  const url = getWebSocketUrl("ws/pose", "client_prod");
  assert.equal(url, "wss://motioniq.example.com/api/ws/pose/client_prod");
});
