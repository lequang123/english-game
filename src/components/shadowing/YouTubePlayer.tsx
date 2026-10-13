"use client";

import { useEffect, useRef } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface PlayerApi {
  playSegment: (start: number, end: number) => void;
  playContinuous: (fromSeconds?: number) => void;
  seekTo: (seconds: number, autoPlay?: boolean) => void;
  pause: () => void;
  play: () => void;
  setSpeed: (rate: number) => void;
}

let apiPromise: Promise<void> | null = null;
function loadYT(): Promise<void> {
  const w = window as any;
  if (w.YT?.Player) return Promise.resolve();
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const prev = w.onYouTubeIframeAPIReady;
      w.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve();
      };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    });
  }
  return apiPromise;
}

interface Props {
  videoId: string;
  onReady: (api: PlayerApi) => void;
  onError?: (errorText: string) => void;
  onTimeUpdate?: (currentTime: number) => void;
  onPlayingChange?: (isPlaying: boolean) => void;
}

export default function YouTubePlayer({
  videoId,
  onReady,
  onError,
  onTimeUpdate,
  onPlayingChange,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onPlayingChangeRef = useRef(onPlayingChange);

  useEffect(() => {
    onReadyRef.current = onReady;
  });
  useEffect(() => {
    onErrorRef.current = onError;
  });
  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  });
  useEffect(() => {
    onPlayingChangeRef.current = onPlayingChange;
  });

  useEffect(() => {
    let player: any;
    let segmentTimer: ReturnType<typeof setInterval> | null = null;
    let trackTimer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;
    let endAt = 0;

    const pollTime = () => {
      if (player && typeof player.getCurrentTime === "function") {
        try {
          const time = player.getCurrentTime();
          if (typeof time === "number") {
            onTimeUpdateRef.current?.(time);
          }
        } catch {}
      }
    };

    const startTracking = () => {
      if (trackTimer) clearInterval(trackTimer);
      pollTime();
      trackTimer = setInterval(pollTime, 30);
    };

    const stopTracking = () => {
      if (trackTimer) {
        clearInterval(trackTimer);
        trackTimer = null;
      }
      pollTime();
    };

    loadYT().then(() => {
      if (cancelled || !hostRef.current) return;
      const el = document.createElement("div");
      hostRef.current.appendChild(el);

      const origin = typeof window !== "undefined" ? window.location.origin : undefined;

      player = new (window as any).YT.Player(el, {
        videoId,
        width: "100%",
        height: "100%",
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          rel: 0,
          playsinline: 1,
          modestbranding: 1,
          origin,
          enablejsapi: 1,
        },
        events: {
          onError: (e: any) => {
            console.warn("YouTube Player error:", e.data);
            let msg = "Video bị hạn chế phát trên trang này.";
            if (e.data === 101 || e.data === 150) {
              msg = "Chủ sở hữu video hoặc chính sách quản trị mạng chặn phát nhúng video này.";
            } else if (e.data === 2) {
              msg = "ID video không hợp lệ.";
            }
            onErrorRef.current?.(msg);
          },
          onStateChange: (e: any) => {
            // 1 = PLAYING, 2 = PAUSED, 0 = ENDED, 3 = BUFFERING
            const isPlaying = e.data === 1;
            onPlayingChangeRef.current?.(isPlaying);
            if (isPlaying) {
              startTracking();
            } else {
              stopTracking();
            }
          },
          onReady: () => {
            onReadyRef.current({
              playSegment: (start, end) => {
                endAt = end;
                if (segmentTimer) clearInterval(segmentTimer);
                try {
                  onTimeUpdateRef.current?.(start);
                  player.seekTo(start, true);
                  player.playVideo();
                  segmentTimer = setInterval(() => {
                    if (player && typeof player.getCurrentTime === "function") {
                      if (player.getCurrentTime() >= endAt) {
                        player.pauseVideo();
                        if (segmentTimer) clearInterval(segmentTimer);
                      }
                    }
                  }, 40);
                } catch (err) {
                  console.warn("Cannot play video segment:", err);
                }
              },
              playContinuous: (fromSeconds) => {
                if (segmentTimer) clearInterval(segmentTimer);
                try {
                  if (fromSeconds !== undefined) {
                    onTimeUpdateRef.current?.(fromSeconds);
                    player.seekTo(fromSeconds, true);
                  }
                  player.playVideo();
                } catch (err) {
                  console.warn("Cannot play video continuously:", err);
                }
              },
              seekTo: (seconds, autoPlay = true) => {
                if (segmentTimer) clearInterval(segmentTimer);
                try {
                  onTimeUpdateRef.current?.(seconds);
                  player.seekTo(seconds, true);
                  if (autoPlay) {
                    player.playVideo();
                  } else {
                    player.pauseVideo();
                  }
                } catch (err) {
                  console.warn("Cannot seek video:", err);
                }
              },
              pause: () => {
                if (segmentTimer) clearInterval(segmentTimer);
                try {
                  player?.pauseVideo?.();
                } catch {}
              },
              play: () => {
                try {
                  player?.playVideo?.();
                } catch {}
              },
              setSpeed: (rate: number) => {
                try {
                  player?.setPlaybackRate?.(rate);
                } catch {}
              },
            });
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (segmentTimer) clearInterval(segmentTimer);
      if (trackTimer) clearInterval(trackTimer);
      try {
        player?.destroy?.();
      } catch {}
    };
  }, [videoId]);

  return (
    <div className="shadow-video-wrapper">
      <div className="shadow-video" ref={hostRef} />
      <div className="shadow-video-bar">
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shadow-video-link"
        >
          <span>🔗 Mở video trên YouTube</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
          </svg>
        </a>
      </div>
    </div>
  );
}
