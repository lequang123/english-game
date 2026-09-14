"use client";

import { useCallback, useRef, useState } from "react";

export function useSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const getContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const playType = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  }, [soundEnabled, getContext]);

  const playDestroy = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getContext();
    // Laser zap sound
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(1500, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
    osc2.type = "square";
    osc2.frequency.setValueAtTime(2000, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.3);
    osc2.stop(ctx.currentTime + 0.3);
  }, [soundEnabled, getContext]);

  const playMiss = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  }, [soundEnabled, getContext]);

  const playLevelUp = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getContext();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.2);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.2);
    });
  }, [soundEnabled, getContext]);

  const playGameOver = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getContext();
    const notes = [440, 415, 392, 349, 330, 262];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.3);
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.3);
    });
  }, [soundEnabled, getContext]);

  const speakWord = useCallback(
    (text: string) => {
      if (!soundEnabled) return;
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.rate = 0.9;
        const voices = window.speechSynthesis.getVoices();
        const enVoice =
          voices.find(
            (v) =>
              v.lang.startsWith("en") &&
              (v.name.includes("Google") ||
                v.name.includes("Natural") ||
                v.name.includes("Samantha") ||
                v.name.includes("Jenny"))
          ) || voices.find((v) => v.lang.startsWith("en"));
        if (enVoice) utterance.voice = enVoice;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("speechSynthesis error", e);
      }
    },
    [soundEnabled]
  );

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  return {
    soundEnabled,
    toggleSound,
    playType,
    playDestroy,
    playMiss,
    playLevelUp,
    playGameOver,
    speakWord,
  };
}
