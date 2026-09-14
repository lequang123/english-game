"use client";

import React from "react";
import GameCard from "./GameCard";

interface GameHubProps {
  onPlayGame: () => void;
}

export default function GameHub({ onPlayGame }: GameHubProps) {
  const games = [
    {
      title: "Đấu Trường Từ Vựng",
      description: "Đấu trắc nghiệm từ vựng 1v1 thời gian thực với người chơi khác — ai trả lời đúng và nhanh hơn sẽ thắng.",
      buttonText: "CHƠI NGAY",
      buttonColor: "red" as const,
      mode: "ĐẤU ONLINE" as const,
      imageColor: "linear-gradient(135deg, #2a0845 0%, #6441A5 100%)",
      icon: "⚔️",
      onClick: () => alert("Game này sắp ra mắt!"),
    },
    {
      title: "Luyện Gõ",
      description: "Gõ các từ tiếng Anh đang rơi để bắn hạ trước khi chúng chạm đất — luyện tốc độ và phản xạ.",
      buttonText: "CHƠI NGAY",
      buttonColor: "blue" as const,
      mode: "CHƠI ĐƠN" as const,
      imageColor: "linear-gradient(135deg, #091236 0%, #1E215D 100%)",
      icon: "🚀",
      onClick: onPlayGame, // This is the game we built
    },
    {
      title: "Mưa Từ Vựng",
      description: "Nhìn nghĩa đang rơi, nhớ ra từ tiếng Anh và gõ — luyện ghi nhớ chủ động thuần túy.",
      buttonText: "CHƠI NGAY",
      buttonColor: "green" as const,
      mode: "CHƠI ĐƠN" as const,
      imageColor: "linear-gradient(135deg, #00467F 0%, #A5CC82 100%)",
      icon: "🌧️",
      onClick: () => alert("Game này sắp ra mắt!"),
    },
    {
      title: "Ong Chính Tả",
      description: "Nghe phát âm và gõ lại từ với chính tả chuẩn xác.",
      buttonText: "CHƠI NGAY",
      buttonColor: "orange" as const,
      mode: "CHƠI ĐƠN" as const,
      imageColor: "linear-gradient(135deg, #f12711 0%, #f5af19 100%)",
      icon: "🐝",
      onClick: () => alert("Game này sắp ra mắt!"),
    },
    {
      title: "Ném Hoa Quả",
      description: "Học từ vựng qua việc ném trái cây vui nhộn.",
      buttonText: "CHƠI NGAY",
      buttonColor: "green" as const,
      isNew: true,
      mode: "CHƠI ĐƠN" as const,
      imageColor: "linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)",
      icon: "🍎",
      onClick: () => alert("Game này sắp ra mắt!"),
    },
    {
      title: "Vẹt Bay Trên Mây",
      description: "Điều khiển vẹt bay qua các chướng ngại vật từ vựng.",
      buttonText: "CHƠI NGAY",
      buttonColor: "blue" as const,
      isNew: true,
      mode: "CHƠI ĐƠN" as const,
      imageColor: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      icon: "☁️",
      onClick: () => alert("Game này sắp ra mắt!"),
    },
    {
      title: "Xây Cầu",
      description: "Xây cầu nối liền các từ đồng nghĩa, trái nghĩa.",
      buttonText: "CHƠI NGAY",
      buttonColor: "orange" as const,
      isNew: true,
      mode: "CHƠI ĐƠN" as const,
      imageColor: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
      icon: "🌉",
      onClick: () => alert("Game này sắp ra mắt!"),
    },
    {
      title: "Nối Từ",
      description: "Trò chơi nối chữ kinh điển.",
      buttonText: "CHƠI NGAY",
      buttonColor: "green" as const,
      isNew: true,
      mode: "CHƠI ĐƠN" as const,
      imageColor: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
      icon: "🧩",
      onClick: () => alert("Game này sắp ra mắt!"),
    },
  ];

  return (
    <div className="game-hub">
      {/* Hero Banner */}
      <div className="hub-hero">
        <div className="hero-content">
          <div className="hero-icon">🎮</div>
          <div className="hero-text">
            <h1>Game học tiếng Anh</h1>
            <p>Chơi 5 phút, nhớ từ cả tuần</p>
          </div>
        </div>
        <div className="hero-icons-row">
          <div className="mini-icon color-red">⚔️</div>
          <div className="mini-icon color-blue">🚀</div>
          <div className="mini-icon color-green">🌧️</div>
          <div className="mini-icon color-orange">🐝</div>
          <div className="mini-icon color-green-light">🍎</div>
          <div className="mini-icon color-purple">☁️</div>
          <div className="mini-icon color-orange-dark">🌉</div>
          <div className="mini-icon color-teal">🧩</div>
          <div className="mini-icon color-orange">⚡</div>
          <div className="mini-icon color-blue-light">💡</div>
          <div className="mini-icon color-pink">🔥</div>
        </div>
      </div>

      {/* Grid Header */}
      <div className="grid-header">
        <h2>Game từ vựng</h2>
        <span className="grid-count">11</span>
        <div className="grid-divider"></div>
      </div>

      {/* Grid */}
      <div className="game-grid">
        {games.map((game, i) => (
          <GameCard key={i} {...game} />
        ))}
      </div>
    </div>
  );
}
