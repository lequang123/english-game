"use client";

interface GameHUDProps {
  score: number;
  lives: number;
  milestone: number;
  combo: number;
  deckName: string;
  wordsDestroyed: number;
}

export default function GameHUD({
  score,
  lives,
  milestone,
  combo,
  deckName,
  wordsDestroyed,
}: GameHUDProps) {
  const milestoneProgress = wordsDestroyed % 20;

  return (
    <div className="game-hud">
      <div className="hud-left">
        <div className="hud-score">
          <span className="hud-score-icon">⭐</span>
          <span className="hud-score-value">{score}</span>
        </div>
        {combo >= 3 && (
          <div className="hud-combo">
            <span className="combo-fire">🔥</span>
            <span className="combo-value">x{combo}</span>
          </div>
        )}
      </div>

      <div className="hud-center">
        <div className="hud-milestone">
          <span className="milestone-label">
            Mốc {milestone}/{milestoneProgress === 0 && wordsDestroyed > 0 ? 20 : milestoneProgress}/20
          </span>
          <span className="milestone-dot">·</span>
          <span className="milestone-deck">{deckName}</span>
        </div>
        <div className="milestone-bar">
          <div
            className="milestone-bar-fill"
            style={{
              width: `${((milestoneProgress === 0 && wordsDestroyed > 0 ? 20 : milestoneProgress) / 20) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="hud-right">
        <div className="hud-hearts">
          {Array.from({ length: 3 }).map((_, i) => (
            <span
              key={i}
              className={`heart ${i < lives ? "alive" : "dead"}`}
            >
              {i < lives ? "❤️" : "🖤"}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
