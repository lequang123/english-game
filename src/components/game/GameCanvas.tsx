"use client";

import { FallingWord } from "@/hooks/useGameEngine";
import WordBullet from "./WordBullet";
import Spaceship from "./Spaceship";
import { useEffect, useRef, useState } from "react";

export interface LaserShot {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  createdAt: number;
}

interface GameCanvasProps {
  words: FallingWord[];
  lasers?: LaserShot[];
  aimAngle?: number;
  firing?: boolean;
}

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
}

export default function GameCanvas({
  words,
  lasers = [],
  aimAngle = 0,
  firing = false,
}: GameCanvasProps) {
  const [stars, setStars] = useState<Star[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const newStars: Star[] = [];
    for (let i = 0; i < 80; i++) {
      newStars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 2,
        opacity: 0.3 + Math.random() * 0.7,
        speed: 0.2 + Math.random() * 0.5,
      });
    }
    setStars(newStars);
  }, []);

  return (
    <div className="game-canvas">
      {/* Starfield background */}
      <div className="starfield">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
              animationDuration: `${2 + star.speed * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Small Glowing Individual Bullet Orbs */}
      {lasers.map((laser) => (
        <div
          key={laser.id}
          className="bullet-orb"
          style={
            {
              "--start-x": `${laser.startX}%`,
              "--start-y": `${laser.startY}%`,
              "--target-x": `${laser.targetX}%`,
              "--target-y": `${laser.targetY}%`,
            } as React.CSSProperties
          }
        />
      ))}

      {/* Falling words */}
      {words.map((word) => (
        <WordBullet key={word.id} word={word} />
      ))}

      {/* Spaceship with swivel aiming and muzzle flash */}
      <Spaceship aimAngle={aimAngle} firing={firing} />

      {/* Bottom danger zone line */}
      <div className="danger-zone" />
    </div>
  );
}
