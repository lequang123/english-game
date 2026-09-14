"use client";

import React from "react";

interface GameCardProps {
  title: string;
  description: string;
  buttonText: string;
  buttonColor: "red" | "blue" | "green" | "orange";
  isNew?: boolean;
  mode: "ĐẤU ONLINE" | "CHƠI ĐƠN";
  imageColor: string;
  icon: string;
  onClick: () => void;
}

export default function GameCard({
  title,
  description,
  buttonText,
  buttonColor,
  isNew,
  mode,
  imageColor,
  icon,
  onClick,
}: GameCardProps) {
  return (
    <div className="game-card">
      <div className="game-card-image" style={{ background: imageColor }}>
        {/* Placeholder for the game illustration */}
        <div className="game-card-icon-large">{icon}</div>
        
        <div className="game-card-badges">
          {isNew && <span className="badge-new">✨ MỚI</span>}
          <span className="badge-mode">{mode}</span>
        </div>
      </div>
      
      <div className="game-card-content">
        <h3 className="game-card-title">
          <span className={`game-card-title-icon color-${buttonColor}`}>
            {icon}
          </span>
          {title}
        </h3>
        <p className="game-card-desc">{description}</p>
        <button 
          className={`game-card-btn btn-${buttonColor}`}
          onClick={onClick}
        >
          {buttonText} &rarr;
        </button>
      </div>
    </div>
  );
}
