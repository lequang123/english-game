"use client";

import React from "react";

export default function Header() {
  return (
    <header className="main-header">
      <div className="header-left">
        <div className="search-bar">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" placeholder="Tra từ điển" />
        </div>
      </div>
      
      <div className="header-right">
        <button className="header-btn facebook-btn">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
          Facebook Community
        </button>
        
        <button className="icon-btn theme-toggle">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
        </button>
        
        <div className="lang-selector">
          <img src="https://flagcdn.com/w20/vn.png" alt="VN" className="flag-icon" />
          <span>Tiếng Việt</span>
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2"><path d="M6 9l6 6 6-6"></path></svg>
        </div>
        
        <button className="icon-btn notification-btn">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        </button>
        
        <div className="stats-badges">
          <div className="badge diamond-badge">
            <span className="badge-icon">💎</span>
            <span className="badge-value">148</span>
          </div>
          <div className="badge coin-badge">
            <span className="badge-icon">🎯</span>
            <span className="badge-value">0/3</span>
          </div>
        </div>
        
        <button className="header-pro-btn">
          👑 PRO
        </button>
      </div>
    </header>
  );
}
