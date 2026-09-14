"use client";

import { Deck } from "@/data/vocabulary";
import { useState } from "react";

interface DeckSelectionProps {
  decks: Deck[];
  onStart: (deck: Deck) => void;
}

export default function DeckSelection({ decks, onStart }: DeckSelectionProps) {
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);

  const selected = decks.find((d) => d.id === selectedDeck);

  return (
    <div className="deck-selection">
      <div className="deck-selection-header">
        <h1 className="deck-selection-title">
          <span className="title-icon">⌨️</span>
          Luyện Gõ
        </h1>
        <p className="deck-selection-subtitle">
          Chọn bộ thẻ từ vựng để bắt đầu luyện tập
        </p>
      </div>

      <div className="deck-grid">
        {decks.map((deck) => (
          <button
            key={deck.id}
            className={`deck-card ${selectedDeck === deck.id ? "selected" : ""}`}
            onClick={() => setSelectedDeck(deck.id)}
            style={
              {
                "--deck-color": deck.color,
              } as React.CSSProperties
            }
          >
            <div className="deck-card-icon">{deck.icon}</div>
            <div className="deck-card-info">
              <h3 className="deck-card-name">{deck.name}</h3>
              <span className="deck-card-count">{deck.words.length} từ</span>
            </div>
            {selectedDeck === deck.id && (
              <div className="deck-card-check">✓</div>
            )}
          </button>
        ))}
      </div>

      <button
        className="start-button"
        disabled={!selected}
        onClick={() => selected && onStart(selected)}
      >
        <span className="start-button-icon">🚀</span>
        Bắt đầu chơi
      </button>
    </div>
  );
}
