"use client";

import React from "react";

export type NavKey = "games" | "shadowing";

interface SidebarProps {
  activeKey?: NavKey;
  onNavigate?: (key: NavKey) => void;
}

export default function Sidebar({ activeKey = "games", onNavigate }: SidebarProps) {
  const menuItems = [
    { icon: "🏠", label: "Trang chủ" },
    { icon: "📚", label: "Chủ đề" },
    { icon: "🎧", label: "Luyện nghe" },
    { icon: "🔁", label: "Shadowing", key: "shadowing" as NavKey },
    { icon: "📄", label: "Từ vựng" },
    { icon: "🎤", label: "Luyện nói" },
    { icon: "📝", label: "Luyện thi TOEIC" },
    { icon: "🎓", label: "Luyện thi IELTS" },
    { icon: "🎮", label: "Trò Chơi", key: "games" as NavKey },
    { icon: "🧠", label: "Ôn tập", hasDropdown: true },
  ];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {menuItems.map((item, i) => {
          const isActive = item.key ? item.key === activeKey : false;
          return (
            <div
              key={i}
              className={`nav-item ${isActive ? "active" : ""}`}
              style={item.key ? { cursor: "pointer" } : undefined}
              onClick={item.key ? () => onNavigate?.(item.key!) : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.hasDropdown && (
                <span className="nav-dropdown">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="pro-button">
          <span className="pro-icon">👑</span>
          MỞ KHÓA PRO
        </button>
        <div className="footer-links">
          <div className="footer-link">
            <span>📝</span> Ghi chú của tôi
          </div>
          <div className="footer-link">
            <span>🔤</span> Từ vựng của tôi
          </div>
          <div className="footer-link text-red">
            <span>🚪</span> Đăng xuất
          </div>
        </div>

        <div className="user-profile">
          <div className="user-avatar">
            <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User" />
            <div className="user-level">Lv.1</div>
          </div>
          <div className="user-info">
            <div className="user-name">teddy</div>
            <div className="user-role">Hồ sơ</div>
          </div>
        </div>

        <div className="collapse-btn">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"></path></svg>
          Thu gọn
        </div>
      </div>
    </aside>
  );
}
