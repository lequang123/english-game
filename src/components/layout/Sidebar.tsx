"use client";

import React from "react";

export default function Sidebar() {
  const menuItems = [
    { icon: "🏠", label: "Trang chủ" },
    { icon: "📚", label: "Chủ đề" },
    { icon: "🎧", label: "Luyện nghe" },
    { icon: "🔁", label: "Shadowing" },
    { icon: "📄", label: "Từ vựng" },
    { icon: "🎤", label: "Luyện nói" },
    { icon: "📝", label: "Luyện thi TOEIC" },
    { icon: "🎓", label: "Luyện thi IELTS" },
    { icon: "🎮", label: "Trò Chơi", active: true },
    { icon: "🧠", label: "Ôn tập", hasDropdown: true },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
          </div>
          <span className="logo-text">Parroto</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item, i) => (
          <div key={i} className={`nav-item ${item.active ? "active" : ""}`}>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.hasDropdown && (
              <span className="nav-dropdown">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2"><path d="M6 9l6 6 6-6"></path></svg>
              </span>
            )}
          </div>
        ))}
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
