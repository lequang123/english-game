"use client";

import { FallingWord } from "@/hooks/useGameEngine";
import { useEffect, useRef, useState } from "react";

interface WordBulletProps {
  word: FallingWord;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export default function WordBullet({ word }: WordBulletProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const prevDestroyedRef = useRef(word.destroyed);

  useEffect(() => {
    if (word.destroyed && !prevDestroyedRef.current) {
      // Spawn vibrant burst particles on destruction
      const newParticles: Particle[] = [];
      const colors = ["#00e5ff", "#2979ff", "#ffffff", "#76ff03", "#ffab00"];
      for (let i = 0; i < 18; i++) {
        const angle = (Math.PI * 2 * i) / 18 + (Math.random() - 0.5) * 0.4;
        const speed = 3 + Math.random() * 5;
        newParticles.push({
          id: i,
          x: 0,
          y: 0,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 3 + Math.random() * 6,
        });
      }
      setParticles(newParticles);
    }
    prevDestroyedRef.current = word.destroyed;
  }, [word.destroyed]);

  // Animate explosion particles
  useEffect(() => {
    if (particles.length === 0) return;
    const interval = setInterval(() => {
      setParticles((prev) => {
        const updated = prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            life: p.life - 0.045,
            vy: p.vy + 0.12,
          }))
          .filter((p) => p.life > 0);
        if (updated.length === 0) clearInterval(interval);
        return updated;
      });
    }, 16);
    return () => clearInterval(interval);
  }, [particles.length]);

  const chars = word.word.split("");

  return (
    <div
      className={`word-bullet ${word.locked ? "locked" : ""} ${word.destroyed ? "destroyed" : ""} ${word.missed ? "missed" : ""}`}
      style={{
        left: `${word.x}%`,
        top: `${word.y}%`,
      }}
    >
      {/* Active word being typed */}
      {!word.destroyed && !word.missed && (
        <div className="word-text">
          {chars.map((char, i) => (
            <span
              key={i}
              className={`word-char ${i < word.typedCount ? "typed" : ""}`}
            >
              {char}
            </span>
          ))}
        </div>
      )}

      {/* Completed word: Celebratory card with Vietnamese translation & pronunciation guide */}
      {word.destroyed && (
        <div className="word-success-card">
          <div className="success-header">
            <span className="success-badge-icon">✓</span>
            <span className="success-word">{word.word}</span>
            <span className="success-audio-icon">🔊</span>
          </div>
          {word.phonetic && <span className="success-phonetic">{word.phonetic}</span>}
          <span className="success-meaning">{word.meaning}</span>
        </div>
      )}

      {/* Missed word banner with Vietnamese translation */}
      {word.missed && (
        <div className="word-missed-info">
          <span className="missed-word">{word.word}</span>
          <span className="missed-meaning">{word.meaning}</span>
          {word.phonetic && <span className="missed-phonetic">{word.phonetic}</span>}
        </div>
      )}

      {/* Burst Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            transform: `translate(${p.x}px, ${p.y}px)`,
            opacity: p.life,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
          }}
        />
      ))}
    </div>
  );
}
