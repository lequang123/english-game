"use client";

interface RightToolbarProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onClose: () => void;
}

export default function RightToolbar({
  soundEnabled,
  onToggleSound,
  onClose,
}: RightToolbarProps) {
  return (
    <div className="right-toolbar">
      <button
        className="toolbar-btn close-btn"
        onClick={onClose}
        title="Đóng"
      >
        ✕
      </button>
      <button
        className="toolbar-btn sound-btn"
        onClick={onToggleSound}
        title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
      >
        {soundEnabled ? "🔊" : "🔇"}
      </button>
    </div>
  );
}
