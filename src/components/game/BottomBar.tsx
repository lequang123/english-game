"use client";

interface BottomBarProps {
  deckName: string;
}

export default function BottomBar({ deckName }: BottomBarProps) {
  return (
    <div className="bottom-bar">
      <span className="bottom-bar-text">
        <span className="bottom-bar-icon">📚</span>
        {deckName}
      </span>
    </div>
  );
}
