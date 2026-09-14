"use client";

import React from "react";
import Image from "next/image";

export default function TopBanner() {
  return (
    <div className="top-banner">
      <div className="top-banner-content">
        <div className="banner-logo-wrapper">
          <div className="app-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a4 4 0 0 1 4 4v2h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2V6a4 4 0 0 1 4-4z"></path>
              <circle cx="9" cy="14" r="1"></circle>
              <circle cx="15" cy="14" r="1"></circle>
              <path d="M12 16v.01"></path>
            </svg>
          </div>
        </div>
        <span className="banner-text">Tải ứng dụng Parroto để học mọi lúc mọi nơi</span>
      </div>
      <div className="store-buttons">
        <button className="store-btn app-store">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.79 3.59-.76 1.41.04 2.54.51 3.23 1.49-2.9 1.76-2.46 5.51.5 6.74-.7 1.83-1.6 3.73-2.4 4.7zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
          <div className="store-btn-text">
            <span>Download on the</span>
            <strong>App Store</strong>
          </div>
        </button>
        <button className="store-btn google-play">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12 3.84 21.85C3.34 21.61 3 21.09 3 20.5ZM14.83 13.14L18.4 15.17L14.83 13.14ZM14.83 10.86L18.4 8.83L14.83 10.86ZM19.26 15.65C19.78 15.35 20.12 14.8 20.12 14.2V9.8C20.12 9.2 19.78 8.65 19.26 8.35L19.26 15.65Z"/></svg>
          <div className="store-btn-text">
            <span>GET IT ON</span>
            <strong>Google Play</strong>
          </div>
        </button>
        <button className="close-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
        </button>
      </div>
    </div>
  );
}
