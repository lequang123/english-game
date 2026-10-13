"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SentenceItem,
  displayWords,
  normalize,
  scoreSentence,
  statusForDisplay,
} from "@/lib/shadowing";
import YouTubePlayer, { PlayerApi } from "./YouTubePlayer";

interface Props {
  items: SentenceItem[];
  videoId?: string;
  supported: boolean;
  listening: boolean;
  transcript: string;
  error: string | null;
  onStartRec: () => void;
  onStopRec: () => void;
  onResetRec: () => void;
  onAbortRec: () => void;
  onSpeak: (text: string) => void;
  onBack: () => void;
}

const ipaCache = new Map<string, string>();

function formatTime(seconds?: number): string {
  if (seconds === undefined || isNaN(seconds)) return "";
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

export default function ShadowingScreen({
  items: initialItems,
  videoId,
  supported,
  listening,
  transcript,
  error,
  onStartRec,
  onStopRec,
  onResetRec,
  onAbortRec,
  onSpeak,
  onBack,
}: Props) {
  const [items, setItems] = useState<SentenceItem[]>(initialItems);
  const [index, setIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"practice" | "watch">("practice");
  const [scores, setScores] = useState<Record<number, number>>({});
  const [results, setResults] = useState<Record<number, ReturnType<typeof scoreSentence>>>({});
  const [showIpa, setShowIpa] = useState(true);
  const [showTrans, setShowTrans] = useState(true);
  const [autoPlaySegment, setAutoPlaySegment] = useState(true);
  const [ipa, setIpa] = useState<Record<string, string>>({});
  const [videoError, setVideoError] = useState<string | null>(null);
  const [useTTSFallback, setUseTTSFallback] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editTrans, setEditTrans] = useState("");

  // Các state mới khớp với ảnh mẫu giao diện
  const [autoPause, setAutoPause] = useState(true);
  const [isLargeVideo, setIsLargeVideo] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [userCommentText, setUserCommentText] = useState("");
  const [reportedCards, setReportedCards] = useState<Record<number, boolean>>({});

  // Audio recording playback (MediaRecorder)
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null);
  const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const userAudioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);
  const [timeOffset] = useState<number>(0.25); // +0.25s bù trễ video chuẩn

  const activeCardRef = useRef<HTMLDivElement | null>(null);
  const wasListening = useRef(false);
  const playerRef = useRef<PlayerApi | null>(null);

  // Popover xem từ loại (POS) & từ gốc (Lemma) từ wink-nlp
  const [activeWordPopover, setActiveWordPopover] = useState<{
    word: string;
    cleanWord: string;
    pos?: string;
    posLabel?: string;
    lemma?: string;
    ipaText?: string;
    x: number;
    y: number;
  } | null>(null);

  // Đồng bộ initial items khi props đổi
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const current = items[index] || items[0] || { text: "" };
  const result = results[index];

  // Chấm điểm khi ngừng ghi âm
  useEffect(() => {
    if (wasListening.current && !listening) {
      if (transcript.trim() && current.text) {
        const r = scoreSentence(current.text, transcript);
        setResults((p) => ({ ...p, [index]: r }));
        setScores((p) => ({ ...p, [index]: Math.max(p[index] ?? 0, r.percent) }));
      }
    }
    wasListening.current = listening;
  }, [listening, transcript, current, index]);

  // Tra cứu IPA
  useEffect(() => {
    if (!showIpa || !current.text) return;
    let cancelled = false;
    const uniq = Array.from(new Set(normalize(current.text).filter((w) => /^[a-z]+(?:'[a-z]+)?$/.test(w))));
    uniq.forEach(async (w) => {
      if (ipaCache.has(w)) {
        if (!cancelled) setIpa((p) => (p[w] ? p : { ...p, [w]: ipaCache.get(w)! }));
        return;
      }
      try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`);
        if (!res.ok) return;
        const data = await res.json();
        const text: string | undefined =
          data?.[0]?.phonetic ?? data?.[0]?.phonetics?.find((p: { text?: string }) => p.text)?.text;
        if (text) {
          ipaCache.set(w, text);
          if (!cancelled) setIpa((p) => ({ ...p, [w]: text }));
        }
      } catch {
        /* offline */
      }
    });
    return () => {
      cancelled = true;
    };
  }, [current, showIpa]);

  // Tự động phân tích từ loại POS & từ gốc Lemma qua wink-nlp nếu câu chưa có tokens
  useEffect(() => {
    if (!current.text || (current.tokens && current.tokens.length > 0)) return;
    fetch(`/api/nlp?text=${encodeURIComponent(current.text)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.tokens && Array.isArray(data.tokens)) {
          setItems((prev) =>
            prev.map((item, idx) => (idx === index ? { ...item, tokens: data.tokens } : item))
          );
        }
      })
      .catch(() => {});
  }, [current.text, current.tokens, index]);

  // Đồng bộ thời gian thực: Khi video chạy, tự động bám sát câu
  const handleTimeUpdate = useCallback(
    (currentTime: number) => {
      setPlaybackTime(currentTime);
      const effectiveTime = currentTime + timeOffset;

      let targetIdx = -1;

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.start === undefined) continue;
        const start = it.start - 0.15;
        const nextStart = items[i + 1]?.start !== undefined ? items[i + 1].start! - 0.15 : Infinity;
        const end = it.end !== undefined ? Math.max(it.end + 0.15, nextStart) : nextStart;

        if (effectiveTime >= start && effectiveTime < end) {
          targetIdx = i;
          break;
        }
      }

      if (targetIdx === -1 && items.length > 0 && items[0].start !== undefined && effectiveTime < items[0].start) {
        targetIdx = 0;
      }

      if (targetIdx === -1 && items.length > 0) {
        for (let i = items.length - 1; i >= 0; i--) {
          if (items[i].start !== undefined && effectiveTime >= items[i].start! - 0.15) {
            targetIdx = i;
            break;
          }
        }
      }

      if (targetIdx !== -1 && targetIdx !== index) {
        setIndex(targetIdx);
      }
    },
    [items, timeOffset, index]
  );

  const go = useCallback(
    (next: number, shouldPlay: boolean = autoPlaySegment) => {
      if (next < 0 || next >= items.length) return;
      onAbortRec();
      onResetRec();
      setIndex(next);
      setUserAudioUrl(null);
      setIsPlayingUserAudio(false);
      if (userAudioPlayerRef.current) userAudioPlayerRef.current.pause();

      const target = items[next];
      if (videoId && playerRef.current && target?.start !== undefined) {
        if (viewMode === "watch") {
          playerRef.current.playContinuous(Math.max(0, target.start - 0.1));
        } else if (shouldPlay && target.end !== undefined) {
          playerRef.current.playSegment(Math.max(0, target.start - 0.15), target.end + 0.25);
        } else {
          playerRef.current.seekTo(Math.max(0, target.start - 0.1), false);
        }
      }
    },
    [items, videoId, autoPlaySegment, viewMode, onAbortRec, onResetRec]
  );

  // Quản lý ghi âm giọng nói người dùng & MediaRecorder
  const toggleRec = useCallback(() => {
    if (listening) {
      onStopRec();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    } else {
      setResults((p) => {
        const { [index]: _removed, ...rest } = p;
        void _removed;
        return rest;
      });
      playerRef.current?.pause();
      setUserAudioUrl(null);
      setIsPlayingUserAudio(false);
      if (userAudioPlayerRef.current) userAudioPlayerRef.current.pause();

      // Bắt đầu MediaRecorder để lưu giọng người dùng phát lại
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => {
            try {
              const mr = new MediaRecorder(stream);
              audioChunksRef.current = [];
              mr.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
              };
              mr.onstop = () => {
                const mime = mr.mimeType || "audio/webm";
                const blob = new Blob(audioChunksRef.current, { type: mime });
                const url = URL.createObjectURL(blob);
                setUserAudioUrl(url);
                stream.getTracks().forEach((track) => track.stop());
              };
              mr.start();
              mediaRecorderRef.current = mr;
            } catch (err) {
              console.warn("MediaRecorder error:", err);
            }
          })
          .catch((err) => {
            console.warn("getUserMedia error:", err);
          });
      }

      onStartRec();
    }
  }, [listening, index, onStartRec, onStopRec]);

  // Phát lại file ghi âm của người dùng
  const playUserAudio = useCallback(() => {
    if (!userAudioUrl) return;
    if (userAudioPlayerRef.current) {
      userAudioPlayerRef.current.pause();
    }
    const audio = new Audio(userAudioUrl);
    userAudioPlayerRef.current = audio;
    setIsPlayingUserAudio(true);
    audio.onended = () => setIsPlayingUserAudio(false);
    audio.onerror = () => setIsPlayingUserAudio(false);
    audio.play().catch(() => setIsPlayingUserAudio(false));
  }, [userAudioUrl]);

  // Nghe câu mẫu
  const listen = useCallback(() => {
    const it = items[index];
    if (videoId && !useTTSFallback && playerRef.current && it.start !== undefined && it.end !== undefined) {
      if (viewMode === "watch") {
        playerRef.current.playContinuous(it.start);
      } else {
        playerRef.current.playSegment(Math.max(0, it.start - 0.15), it.end + 0.25);
      }
    } else {
      onSpeak(it.text);
    }
  }, [items, index, videoId, useTTSFallback, viewMode, onSpeak]);

  // Replay câu hiện tại từ đầu
  const replayCurrentSentence = useCallback(() => {
    const it = items[index];
    if (videoId && playerRef.current && it?.start !== undefined) {
      playerRef.current.seekTo(Math.max(0, it.start - 0.1), true);
      if (it.end !== undefined && autoPause) {
        playerRef.current.playSegment(Math.max(0, it.start - 0.1), it.end + 0.25);
      } else {
        playerRef.current.play();
      }
    }
  }, [items, index, videoId, autoPause]);

  // Cuộn thẻ câu vào tầm mắt
  useEffect(() => {
    activeCardRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [index]);

  // Phím tắt
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingIndex !== null) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (supported) toggleRec();
      } else if (e.key === "ArrowRight") go(index + 1);
      else if (e.key === "ArrowLeft") go(index - 1);
      else if (e.key.toLowerCase() === "r") replayCurrentSentence();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [go, index, supported, toggleRec, editingIndex, replayCurrentSentence]);

  const startEdit = (i: number) => {
    setEditingIndex(i);
    setEditText(items[i].text);
    setEditTrans(items[i].translation || "");
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    setItems((prev) =>
      prev.map((it, i) =>
        i === editingIndex ? { ...it, text: editText.trim(), translation: editTrans.trim() || undefined } : it
      )
    );
    setEditingIndex(null);
  };

  const mergeWithNext = (i: number) => {
    if (i >= items.length - 1) return;
    const curItem = items[i];
    const nextItem = items[i + 1];
    const merged: SentenceItem = {
      text: `${curItem.text} ${nextItem.text}`,
      translation:
        curItem.translation || nextItem.translation
          ? `${curItem.translation || ""} ${nextItem.translation || ""}`.trim()
          : undefined,
      start: curItem.start,
      end: nextItem.end,
    };
    setItems((prev) => [...prev.slice(0, i), merged, ...prev.slice(i + 2)]);
    setEditingIndex(null);
  };

  const handleWordClick = (w: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const clean = w.replace(/[^a-zA-Z']/g, "").trim();
    if (!clean) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const token = current.tokens?.find(
      (t) => t.word.toLowerCase() === clean.toLowerCase()
    );
    const key = normalize(w)[0];
    const phonetic = key && ipa[key] ? `/${ipa[key].replace(/^\/|\/$/g, "")}/` : undefined;

    setActiveWordPopover({
      word: w,
      cleanWord: clean,
      pos: token?.pos,
      posLabel: token?.posLabel,
      lemma: token?.lemma || clean.toLowerCase(),
      ipaText: phonetic,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  };

  const speakSingleWord = (word: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(word);
      u.lang = "en-US";
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  const currentWords = useMemo(() => displayWords(current.text), [current]);
  const statuses = useMemo(
    () => (result ? statusForDisplay(current.text, result.words) : null),
    [current, result]
  );

  const done = Object.keys(scores).length;
  const avg = done ? Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / done) : 0;
  const progress = Math.round((done / items.length) * 100);

  return (
    <div className={`shadow-page-container ${isLargeVideo || !showSidebar ? "is-theater-mode" : ""}`}>
      {/* 1. THANH ĐIỀU HƯỚNG BREADCRUMB PHÍA TRÊN */}
      <header className="shadow-breadcrumb-bar">
        <div className="shadow-breadcrumb-left">
          <button type="button" className="crumb-btn" onClick={onBack}>
            Topics
          </button>
          <span className="crumb-sep">&gt;</span>
          <button type="button" className="crumb-btn" onClick={onBack}>
            Learning resources
          </button>
          <span className="crumb-sep">&gt;</span>
          <span className="crumb-title">How to Improve Spelling</span>
          <span className="crumb-check-badge" title="Đã xác thực">✓</span>
          <span className="crumb-level-tag">B1</span>
        </div>

        <div className="shadow-breadcrumb-right">
          <div className="shadow-timer-pill" title="Thời gian học phiên này">
            <span className="timer-icon">⏰</span> 1:20
          </div>

          <button
            type="button"
            className="shadow-btn-toggle-transcript"
            onClick={() => setShowSidebar((v) => !v)}
            title={showSidebar ? "Ẩn cột bản chép bên phải" : "Hiện cột bản chép bên phải"}
          >
            {showSidebar ? "👁️‍🗨️ Ẩn transcript" : "👁️ Hiện transcript"}
          </button>

          <div className="shadow-mode-switch">
            <button
              type="button"
              className={`shadow-mode-btn ${viewMode === "watch" ? "active" : ""}`}
              onClick={() => {
                setViewMode("watch");
                if (videoId && playerRef.current) {
                  playerRef.current.playContinuous(items[index]?.start);
                }
              }}
              title="Video chạy liên tục, chữ và câu tự động trôi theo thời gian thực"
            >
              👁️ XEM
            </button>
            <button
              type="button"
              className={`shadow-mode-btn ${viewMode === "practice" ? "active" : ""}`}
              onClick={() => {
                setViewMode("practice");
                playerRef.current?.pause();
              }}
              title="Dừng theo từng câu để luyện nói"
            >
              🎙️ LUYỆN
            </button>
          </div>
        </div>
      </header>

      {/* 2. KHUNG NỘI DUNG CHÍNH (2 CỘT HOẶC THEATER MODE) */}
      <div className="shadow-body-grid">
        {/* CỘT TRÁI: VIDEO + VIDEO TOOLBAR + CÂU LUYỆN TẬP + ACCORDION */}
        <main className="shadow-main-col">
          {videoId && (
            <div className="shadow-video-section">
              <YouTubePlayer
                videoId={videoId}
                onReady={(api) => {
                  playerRef.current = api;
                }}
                onError={(msg) => {
                  setVideoError(msg);
                  setUseTTSFallback(true);
                }}
                onTimeUpdate={handleTimeUpdate}
                onPlayingChange={setIsPlayingVideo}
              />

              {videoError && (
                <div className="shadow-alert shadow-alert-warning" role="alert">
                  <div className="shadow-alert-title">⚠️ {videoError}</div>
                  <div className="shadow-alert-desc">
                    Mạng Wi-Fi hoặc tài khoản Google Workspace đang bật <strong>Chế độ hạn chế</strong>.
                    Hệ thống đã tự động bật giọng đọc máy (TTS) để bạn vẫn nghe mẫu và luyện nói!
                  </div>
                </div>
              )}

              {/* THANH ĐIỀU KHIỂN VIDEO CHUYÊN DỤNG (DƯỚI VIDEO) */}
              <div className="shadow-video-toolbar">
                {/* Bên trái: 2 Toggle Switches */}
                <div className="toolbar-switches-group">
                  <label className="shadow-switch-item" title="Tự động dừng video sau mỗi câu để bạn luyện nói">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={autoPause}
                      className={`shadow-switch-pill ${autoPause ? "is-on" : ""}`}
                      onClick={() => setAutoPause(!autoPause)}
                    >
                      <span className="shadow-switch-thumb" />
                    </button>
                    <span className="shadow-switch-text">Tự động dừng</span>
                  </label>

                  <label className="shadow-switch-item" title="Phóng to khung video và ẩn cột phụ đề bên phải">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isLargeVideo}
                      className={`shadow-switch-pill ${isLargeVideo ? "is-on" : ""}`}
                      onClick={() => {
                        const next = !isLargeVideo;
                        setIsLargeVideo(next);
                        if (next) setShowSidebar(false);
                        else setShowSidebar(true);
                      }}
                    >
                      <span className="shadow-switch-thumb" />
                    </button>
                    <span className="shadow-switch-text">Video kích thước lớn</span>
                  </label>
                </div>

                {/* Ở giữa: Cụm nút điều hướng và nghe lại */}
                <div className="toolbar-nav-group">
                  <button
                    type="button"
                    className="toolbar-nav-btn"
                    onClick={() => go(index - 1)}
                    disabled={index <= 0}
                    title="Câu trước (Mũi tên trái)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="toolbar-nav-btn toolbar-nav-replay"
                    onClick={replayCurrentSentence}
                    title="Nghe lại câu hiện tại (Phím R)"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="toolbar-nav-btn toolbar-nav-playpause"
                    onClick={() => {
                      if (isPlayingVideo) {
                        playerRef.current?.pause();
                      } else {
                        replayCurrentSentence();
                      }
                    }}
                    title={isPlayingVideo ? "Tạm dừng" : "Phát câu này"}
                  >
                    {isPlayingVideo ? (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  <button
                    type="button"
                    className="toolbar-nav-btn"
                    onClick={() => go(index + 1)}
                    disabled={index >= items.length - 1}
                    title="Câu tiếp (Mũi tên phải)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                    </svg>
                  </button>
                </div>

                {/* Bên phải: Tốc độ, Cài đặt, Phím tắt */}
                <div className="toolbar-extras-group">
                  <div className="speed-dropdown-wrapper">
                    <button
                      type="button"
                      className="toolbar-extra-btn speed-toggle-btn"
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      title="Chọn tốc độ phát"
                    >
                      ⚡ {playbackSpeed}x
                    </button>
                    {showSpeedMenu && (
                      <div className="speed-menu-popover">
                        {[0.75, 1, 1.25, 1.5].map((spd) => (
                          <button
                            key={spd}
                            type="button"
                            className={`speed-option ${playbackSpeed === spd ? "is-selected" : ""}`}
                            onClick={() => {
                              setPlaybackSpeed(spd);
                              playerRef.current?.setSpeed(spd);
                              setShowSpeedMenu(false);
                            }}
                          >
                            {spd}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="toolbar-extra-btn"
                    title="Cài đặt giọng đọc / giao diện"
                    onClick={() => setUseTTSFallback((v) => !v)}
                  >
                    ⚙
                  </button>

                  <button
                    type="button"
                    className="toolbar-extra-btn"
                    title="Xem phím tắt"
                    onClick={() => setShowShortcuts(!showShortcuts)}
                  >
                    ⌨
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VÙNG LUYỆN CÂU TRUNG TÂM (CÂU TIẾNG ANH + PHIÊN ÂM IPA CĂN NGAY NGẮN DƯỚI TỪNG TỪ) */}
          <div className="shadow-sentence-stage">
            <div className="shadow-word-container" aria-live="polite">
              {currentWords.map((w, i) => {
                const key = normalize(w)[0];
                const statusClass = statuses ? `is-${statuses[i]}` : "";

                return (
                  <div
                    key={i}
                    className={`shadow-word-unit ${statusClass}`}
                    onClick={(e) => handleWordClick(w, e)}
                    title="Bấm để xem Từ loại (POS), Dạng gốc (Lemma) & Tra từ điển"
                    role="button"
                    tabIndex={0}
                  >
                    <span className="shadow-word-text">{w}</span>
                    {showIpa && (
                      <span className="shadow-word-ipa">
                        {key && ipa[key] ? `/${ipa[key].replace(/^\/|\/$/g, "")}/` : "\u00A0"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* POPUP XEM TỪ LOẠI (POS) & DẠNG GỐC (LEMMA) WINK-NLP */}
            {activeWordPopover && (
              <>
                <div
                  className="shadow-word-popover-backdrop"
                  onClick={() => setActiveWordPopover(null)}
                />
                <div
                  className="shadow-word-popover"
                  style={{
                    left: `${activeWordPopover.x}px`,
                    top: `${activeWordPopover.y}px`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="popover-header-row">
                    <div className="popover-word-title">
                      <span>{activeWordPopover.cleanWord}</span>
                      {activeWordPopover.ipaText && (
                        <span className="popover-ipa-tag">{activeWordPopover.ipaText}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="popover-close-btn"
                      onClick={() => setActiveWordPopover(null)}
                      title="Đóng"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="popover-badge-row">
                    <span className={`pos-tag-pill pos-${activeWordPopover.pos || "X"}`}>
                      🏷️ {activeWordPopover.posLabel || "Từ vựng"}
                    </span>
                  </div>

                  <div className="popover-lemma-row">
                    <span>🌱 Dạng gốc:</span>
                    <span className="popover-lemma-val">
                      {activeWordPopover.lemma || activeWordPopover.cleanWord.toLowerCase()}
                    </span>
                  </div>

                  <div className="popover-actions-row">
                    <button
                      type="button"
                      className="popover-act-btn"
                      onClick={() => speakSingleWord(activeWordPopover.cleanWord)}
                      title="Phát âm từ này"
                    >
                      🔊 Nghe
                    </button>
                    <a
                      href={`https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(
                        activeWordPopover.lemma || activeWordPopover.cleanWord
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="popover-act-btn primary"
                      title="Tra cứu từ điển Cambridge"
                    >
                      📖 Tra từ
                    </a>
                  </div>
                </div>
              </>
            )}

            {showTrans && current.translation && (
              <p className="shadow-translation-sub">{current.translation}</p>
            )}

            {/* CỤM NÚT BẤM: [ ▷ PHÁT LẠI GHI ÂM ] VÀ [ 🎙 GHI ÂM ] */}
            <div className="shadow-main-action-buttons">
              <button
                type="button"
                className="shadow-btn-replay-voice"
                onClick={playUserAudio}
                disabled={!userAudioUrl || isPlayingUserAudio}
                title={userAudioUrl ? "Bấm để nghe lại giọng bạn vừa đọc" : "Hãy ghi âm trước để nghe lại"}
              >
                <span className="play-triangle-icon">▷</span>
                <span>{isPlayingUserAudio ? "ĐANG PHÁT LẠI..." : "PHÁT LẠI GHI ÂM"}</span>
              </button>

              <button
                type="button"
                className={`shadow-btn-record-main ${listening ? "is-recording" : ""}`}
                onClick={toggleRec}
                disabled={!supported}
                title="Bấm hoặc nhấn Space để bắt đầu / dừng ghi âm"
              >
                <span className="rec-dot-icon" aria-hidden="true" />
                <span>{listening ? "DỪNG GHI ÂM" : "🎙 GHI ÂM"}</span>
              </button>
            </div>

            {/* Hộp thông báo nhận dạng và kết quả */}
            {!supported && (
              <div className="shadow-alert" role="alert">
                Trình duyệt này chưa hỗ trợ Web Speech API. Hãy mở trên Chrome hoặc Edge để luyện nói.
              </div>
            )}
            {error && (
              <div className="shadow-alert" role="alert">
                {error}
              </div>
            )}

            {/* Hiển thị văn bản máy nghe được */}
            <div className="shadow-heard-box">
              {listening && !transcript && <span className="shadow-heard-waiting">Đang lắng nghe, hãy nói to câu trên...</span>}
              {transcript && (
                <>
                  <span className="shadow-heard-label">Máy nghe được:</span>
                  <span className="shadow-heard-text">{transcript}</span>
                </>
              )}
            </div>

            {/* Thẻ điểm sau khi ghi âm */}
            {result && !listening && (
              <div className={`shadow-score-card ${result.percent >= 80 ? "good" : result.percent >= 50 ? "ok" : "low"}`}>
                <span className="score-percent">{result.percent}%</span>
                <span className="score-desc">
                  {result.percent >= 80
                    ? "Rất chuẩn! Phát âm của bạn rất tốt."
                    : "Một số từ phát âm chưa rõ. Bấm nghe lại mẫu và thử lại nhé!"}
                </span>
              </div>
            )}
          </div>

          {/* 3. ACCORDION BÌNH LUẬN & GHI CHÚ BÊN DƯỚI */}
          <div className="shadow-comments-accordion">
            <button
              type="button"
              className="accordion-header-btn"
              onClick={() => setShowComments(!showComments)}
            >
              <div className="accordion-title-row">
                <span className="comment-bubble-icon">💬</span>
                <span className="comment-label">BÌNH LUẬN</span>
                <span className="comment-badge">3270</span>
              </div>
              <span className={`accordion-chevron ${showComments ? "is-expanded" : ""}`}>⌄</span>
            </button>

            {showComments && (
              <div className="accordion-content-panel">
                <div className="comment-input-row">
                  <input
                    type="text"
                    className="comment-text-input"
                    placeholder="Viết ghi chú cá nhân hoặc thắc mắc về câu này..."
                    value={userCommentText}
                    onChange={(e) => setUserCommentText(e.target.value)}
                  />
                  <button
                    type="button"
                    className="comment-submit-btn"
                    onClick={() => {
                      if (userCommentText.trim()) {
                        alert("Đã lưu ghi chú câu này vào sổ tay học tập!");
                        setUserCommentText("");
                      }
                    }}
                  >
                    Gửi
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* CỘT PHẢI: BẢN CHÉP (DANH SÁCH THẺ CÂU) */}
        {showSidebar && (
          <aside className="shadow-sidebar-col" aria-label="Bản chép video">
            <div className="sidebar-header-bar">
              <span className="sidebar-title">BẢN CHÉP</span>
              <label className="sidebar-check-toggle" title="Ẩn/Hiện phiên âm IPA">
                <input type="checkbox" checked={showIpa} onChange={(e) => setShowIpa(e.target.checked)} />
                <span>👁️ IPA</span>
              </label>
              <label className="sidebar-check-toggle" title="Ẩn/Hiện bản dịch tiếng Việt">
                <input type="checkbox" checked={showTrans} onChange={(e) => setShowTrans(e.target.checked)} />
                <span>👁️ Trans</span>
              </label>
              <span className="sidebar-progress-badge">{progress}%</span>
            </div>

            <div className="shadow-card-scroll-list">
              {items.map((it, i) => (
                <div
                  key={i}
                  ref={i === index ? activeCardRef : null}
                  className={`shadow-transcript-card ${i === index ? "is-active" : ""}`}
                  onClick={() => go(i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") go(i);
                  }}
                >
                  <div className="card-top-row">
                    <span className="card-index-tag">#{i + 1}</span>
                    <div className="card-actions-group">
                      <button
                        type="button"
                        className="card-icon-action"
                        title="Chỉnh sửa câu"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(i);
                        }}
                      >
                        📝
                      </button>
                      <button
                        type="button"
                        className="card-icon-action"
                        title="Báo lỗi phụ đề hoặc âm thanh"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReportedCards((prev) => ({ ...prev, [i]: true }));
                          alert(`Đã ghi nhận báo cáo cho câu #${i + 1}!`);
                        }}
                      >
                        {reportedCards[i] ? "✅" : "⚠️"}
                      </button>
                    </div>
                  </div>

                  <div className="card-english-text">{it.text}</div>
                  {showTrans && it.translation && (
                    <div className="card-vietnamese-trans">{it.translation}</div>
                  )}

                  {/* Thanh tiến độ video chạy mượt mà dưới đáy thẻ */}
                  {i === index && it.start !== undefined && (
                    <div
                      className="card-bottom-progress-bar"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            (((playbackTime + timeOffset - it.start) /
                              Math.max(0.4, (it.end ?? it.start + 3) - it.start)) *
                              100)
                          )
                        )}%`,
                      }}
                    />
                  )}

                  {/* Hộp chỉnh sửa nội dung câu */}
                  {editingIndex === i && (
                    <div className="card-inline-edit-box" onClick={(e) => e.stopPropagation()}>
                      <label className="edit-label">Tiếng Anh:</label>
                      <input
                        className="edit-input"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                      />
                      <label className="edit-label">Bản dịch:</label>
                      <input
                        className="edit-input"
                        value={editTrans}
                        onChange={(e) => setEditTrans(e.target.value)}
                      />
                      <div className="edit-buttons-row">
                        {i < items.length - 1 && (
                          <button
                            type="button"
                            className="edit-sub-btn"
                            onClick={() => mergeWithNext(i)}
                          >
                            🔗 Ghép câu sau
                          </button>
                        )}
                        <button
                          type="button"
                          className="edit-sub-btn"
                          onClick={() => setEditingIndex(null)}
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          className="edit-save-btn"
                          onClick={saveEdit}
                        >
                          Lưu
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* MODAL PHÍM TẮT HỖ TRỢ */}
      {showShortcuts && (
        <div className="shadow-modal-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="shadow-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>⌨ Phím tắt Shadowing</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowShortcuts(false)}>✕</button>
            </div>
            <ul className="modal-shortcuts-list">
              <li><kbd>Space</kbd> : Bắt đầu / Dừng ghi âm nói</li>
              <li><kbd>→</kbd> : Chuyển sang câu tiếp theo</li>
              <li><kbd>←</kbd> : Quay lại câu trước đó</li>
              <li><kbd>R</kbd> : Nghe lại câu hiện tại</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
