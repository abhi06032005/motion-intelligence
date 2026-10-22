"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { NormalizedLandmark } from "@/lib/mediapipe";
import { recordResponse, recordSend } from "@/lib/cameraAudit";
import { API_BASE_URL, getWebSocketUrl } from "@/lib/config";

export type WebSocketState = "disconnected" | "connecting" | "connected" | "error";

export interface FormCorrectionMessage {
  state: "idle" | "stationary" | "scanning" | "active";
  current_exercise: string | null;
  exercise_display: string;
  rep_count: number;
  rep_phase: string;
  phase_display: string;
  is_rep_valid: boolean;
  violations: string[];
  corrections: string[];
  correction_message: string;
  joint_colors: Record<string, string>;
  confidence: number;
  is_stationary: boolean;
  timestamp: number;
  exercise_confidence: number;
  form_confidence: number;
  signal_quality: string;
  camera_view: string;
  frame_id?: number;
  backend_processing_ms?: number;
  // Research Layer enhancements
  view_suitability?: "optimal" | "acceptable" | "suboptimal";
  yaw_angle_deg?: number;
  assessment_status?: "assessable" | "uncertain" | "unassessable";
  recommendation?: string;
  smoothness_score?: number;
  symmetry_ratio?: number;
}

export function usePoseWebSocket(mode: "exercise" | "yoga" = "exercise") {
  const [wsState, setWsState] = useState<WebSocketState>("disconnected");
  const [lastMessage, setLastMessage] = useState<FormCorrectionMessage | null>(null);
  const [enableVoice, setEnableVoice] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string>(`client_${Math.random().toString(36).substring(2, 9)}`);
  const lastSpokenTimeRef = useRef<number>(0);
  const lastSpokenTextRef = useRef<string>("");
  const enableVoiceRef = useRef<boolean>(enableVoice);
  const isManuallyClosedRef = useRef<boolean>(false);

  // Keep ref synchronized with current toggle state without triggering reconnects
  useEffect(() => {
    enableVoiceRef.current = enableVoice;
    if (!enableVoice && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [enableVoice]);

  const connect = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    isManuallyClosedRef.current = false;
    setWsState("connecting");
    const endpoint = mode === "yoga" ? "ws/yoga" : "ws/pose";
    const wsUrl = getWebSocketUrl(endpoint, clientIdRef.current);

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsState("connected");
      };

      ws.onmessage = (event) => {
        try {
          const data: FormCorrectionMessage = JSON.parse(event.data);
          recordResponse(data.frame_id, data, data.backend_processing_ms);
          setLastMessage(data);

          // Handle Voice feedback if enabled (reads from ref to avoid stale closures)
          if (
            enableVoiceRef.current &&
            data.correction_message &&
            typeof window !== "undefined" &&
            "speechSynthesis" in window
          ) {
            const now = Date.now();
            const isNewText = data.correction_message !== lastSpokenTextRef.current;
            const isIntervalElapsed = now - lastSpokenTimeRef.current > 3500;

            if (isNewText || isIntervalElapsed) {
              lastSpokenTimeRef.current = now;
              lastSpokenTextRef.current = data.correction_message;
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(data.correction_message);
              utterance.rate = 1.0;
              utterance.volume = 0.85;
              window.speechSynthesis.speak(utterance);
            }
          }
        } catch (err) {
          console.error("Error parsing WebSocket frame:", err);
        }
      };

      ws.onerror = (err) => {
        console.warn("WebSocket error:", err);
        setWsState("error");
      };

      ws.onclose = () => {
        if (!isManuallyClosedRef.current) {
          setWsState("disconnected");
        }
      };

      socketRef.current = ws;
    } catch (err) {
      console.error("Failed to establish WebSocket connection:", err);
      setWsState("error");
    }
  }, [mode]);

  const disconnect = useCallback(() => {
    isManuallyClosedRef.current = true;
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch {}
      socketRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setWsState("disconnected");
  }, []);

  const sendLandmarks = useCallback(
    (landmarks: NormalizedLandmark[], cameraView = "auto", frameId?: number) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        const payload = {
          landmarks,
          timestamp: Date.now() / 1000.0,
          camera_view: cameraView,
          frame_id: frameId,
        };
        if (frameId !== undefined) recordSend(frameId);
        socketRef.current.send(JSON.stringify(payload));
      }
    },
    []
  );

  const resetSession = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/api/reset/${clientIdRef.current}`, { method: "POST" });
    } catch {}
    setLastMessage(null);
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    wsState,
    connect,
    disconnect,
    sendLandmarks,
    lastMessage,
    enableVoice,
    setEnableVoice,
    resetSession,
  };
}
