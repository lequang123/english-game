"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
type SR = any;

export function useSpeechRecognition() {
  const recRef = useRef<SR | null>(null);
  const finalRef = useRef("");
  const supported = useSyncExternalStore(
    () => () => {},
    () => {
      const w = window as any;
      return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
    },
    () => true
  );
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => recRef.current?.abort?.();
  }, []);

  const start = useCallback(() => {
    const w = window as any;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    recRef.current?.abort?.();
    const rec: SR = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    finalRef.current = "";
    setTranscript("");
    setError(null);
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = (e: any) => {
      const map: Record<string, string> = {
        "not-allowed": "Chưa cho phép micro. Hãy bật quyền micro cho trang này rồi thử lại.",
        "service-not-allowed": "Chưa cho phép micro. Hãy bật quyền micro cho trang này rồi thử lại.",
        "no-speech": "Không nghe thấy giọng nói. Hãy nói gần micro hơn và thử lại.",
        network: "Lỗi mạng khi nhận dạng giọng nói. Kiểm tra kết nối rồi thử lại.",
        "audio-capture": "Không tìm thấy micro. Hãy cắm micro và thử lại.",
      };
      if (e.error !== "aborted") setError(map[e.error] ?? "Không nhận dạng được giọng nói.");
    };
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript + " ";
        else interim += r[0].transcript;
      }
      setTranscript((finalRef.current + interim).trim());
    };
    recRef.current = rec;
    try {
      rec.start();
    } catch {
      /* đang chạy */
    }
  }, []);

  const stop = useCallback(() => recRef.current?.stop?.(), []);
  const abort = useCallback(() => {
    recRef.current?.abort?.();
    setListening(false);
  }, []);
  const reset = useCallback(() => {
    finalRef.current = "";
    setTranscript("");
    setError(null);
  }, []);

  return { supported, listening, transcript, error, start, stop, abort, reset };
}
