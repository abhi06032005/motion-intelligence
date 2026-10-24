"""Regression tests for per-client WebSocket isolation and private session resets."""

import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from main import app


def test_public_reset_routes_cannot_modify_connected_sessions():
    client = TestClient(app)
    with client.websocket_connect("/api/ws/pose/reset_owner") as ws:
        # A reset command is valid only on the connected owner's socket.
        ws.send_json({"action": "reset"})
        response = client.post("/api/reset/reset_owner")
        assert response.status_code == 410
    assert client.post("/api/reset/yoga/any_user").status_code == 410


@pytest.mark.parametrize("path", ["/api/ws/pose/shared_id", "/api/ws/yoga/shared_id"])
def test_duplicate_client_ids_do_not_take_over_an_existing_socket(path):
    client = TestClient(app)
    with client.websocket_connect(path) as first:
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect(path) as second:
                second.receive_json()
        # Connection is still live; no 2nd session should overwrite its state.
        if "yoga" in path:
            from api.yoga_routes import manager
        else:
            from api.routes import manager
        assert "shared_id" in manager.active_connections
