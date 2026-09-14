"use client";

import { VocabularyWord } from "@/data/vocabulary";

interface GameOverScreenProps {
  score: number;
  wordsDestroyed: number;
  maxCombo: number;
  totalTyped: number;
  correctTyped: number;
  missedWords: VocabularyWord[];
  onPlayAgain: () => void;
  onBack: () => void;
}

export default function GameOverScreen({
  score,
  wordsDestroyed,
  maxCombo,
  totalTyped,
  correctTyped,
  missedWords,
  onPlayAgain,
  onBack,
}: GameOverScreenProps) {
  const accuracy = totalTyped > 0 ? Math.round((correctTyped / totalTyped) * 100) : 0;

  return (
    <div className="gameover-overlay">
      <div className="gameover-card">
        <div className="gameover-header">
          <h2 className="gameover-title">Game Over</h2>
          <div className="gameover-score-big">
            <span className="gameover-star">⭐</span>
            <span>{score}</span>
          </div>
        </div>

        <div className="gameover-stats">
          <div className="stat-item">
            <span className="stat-icon">🎯</span>
            <span className="stat-value">{wordsDestroyed}</span>
            <span className="stat-label">Từ đã hạ</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🔥</span>
            <span className="stat-value">{maxCombo}</span>
            <span className="stat-label">Combo max</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">📊</span>
            <span className="stat-value">{accuracy}%</span>
            <span className="stat-label">Chính xác</span>
          </div>
        </div>

        {missedWords.length > 0 && (
          <div className="gameover-missed">
            <h3 className="missed-title">📝 Từ cần ôn lại</h3>
            <div className="missed-list">
              {missedWords.slice(0, 10).map((w, i) => (
                <div key={i} className="missed-item">
                  <span className="missed-en">{w.word}</span>
                  <span className="missed-vi">{w.meaning}</span>
                </div>
              ))}
              {missedWords.length > 10 && (
                <div className="missed-more">
                  +{missedWords.length - 10} từ khác
                </div>
              )}
            </div>
          </div>
        )}

        <div className="gameover-actions">
          <button className="btn-play-again" onClick={onPlayAgain}>
            🔄 Chơi lại
          </button>
          <button className="btn-back" onClick={onBack}>
            ← Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}
