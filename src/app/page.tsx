"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Deck, decks } from "@/data/vocabulary";
import { useGameEngine } from "@/hooks/useGameEngine";
import { useSound } from "@/hooks/useSound";
import DeckSelection from "@/components/game/DeckSelection";
import GameCanvas, { LaserShot } from "@/components/game/GameCanvas";
import GameHUD from "@/components/game/GameHUD";
import RightToolbar from "@/components/game/RightToolbar";
import BottomBar from "@/components/game/BottomBar";
import GameOverScreen from "@/components/game/GameOverScreen";
import TopBanner from "@/components/layout/TopBanner";
import Sidebar, { NavKey } from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import GameHub from "@/components/hub/GameHub";
import ShadowingSetup from "@/components/shadowing/ShadowingSetup";
import ShadowingScreen from "@/components/shadowing/ShadowingScreen";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { SentenceItem } from "@/lib/shadowing";
import { FallingWord } from "@/hooks/useGameEngine";

type AppState = "hub" | "deck-selection" | "playing" | "gameover" | "shadowing-setup" | "shadowing";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("hub");
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [lasers, setLasers] = useState<LaserShot[]>([]);
  const [shadowItems, setShadowItems] = useState<SentenceItem[]>([]);
  const [shadowVideoId, setShadowVideoId] = useState<string | undefined>();
  const rec = useSpeechRecognition();
  const [firing, setFiring] = useState(false);
  const firingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    soundEnabled,
    toggleSound,
    playType,
    playDestroy,
    playMiss,
    playLevelUp,
    playGameOver,
    speakWord,
  } = useSound();

  const fireLaser = useCallback((targetX: number, targetY: number) => {
    const dx = targetX - 50;
    const dy = targetY - 91;
    const angle = Math.max(-55, Math.min(55, Math.atan2(dx, -dy) * (180 / Math.PI)));
    const rad = (angle * Math.PI) / 180;
    const startX = 50 + Math.sin(rad) * 4.5;
    const startY = 91 - Math.cos(rad) * 4.5;

    const newLaser: LaserShot = {
      id: `bullet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      startX,
      startY,
      targetX,
      targetY,
      createdAt: Date.now(),
    };
    setLasers((prev) => [...prev.slice(-12), newLaser]);
    setFiring(true);
    if (firingTimerRef.current) clearTimeout(firingTimerRef.current);
    firingTimerRef.current = setTimeout(() => setFiring(false), 70);

    setTimeout(() => {
      setLasers((prev) => prev.filter((l) => l.id !== newLaser.id));
    }, 380);
  }, []);

  const callbacks = useMemo(
    () => ({
      onType: (event?: { targetX: number; targetY: number; char: string }) => {
        playType();
        if (event) {
          fireLaser(event.targetX, event.targetY);
        }
      },
      onDestroy: (word: FallingWord) => {
        if (word) {
          speakWord(word.word);
        }
      },
      onMiss: playMiss,
      onLevelUp: playLevelUp,
      onGameOver: () => {
        playGameOver();
        setAppState("gameover");
      },
    }),
    [playType, playMiss, playLevelUp, playGameOver, speakWord, fireLaser]
  );

  const vocabulary = selectedDeck?.words || [];

  const {
    words,
    score,
    lives,
    combo,
    maxCombo,
    milestone,
    wordsDestroyed,
    totalTyped,
    correctTyped,
    missedWords,
    gameStatus,
    startGame,
    stopGame,
    handleKeyPress,
  } = useGameEngine(vocabulary, callbacks);

  // Calculate target aim angle for spaceship
  const lockedWord = useMemo(
    () => words.find((w) => (w.locked || w.typedCount > 0) && !w.destroyed && !w.missed),
    [words]
  );

  const aimAngle = useMemo(() => {
    if (!lockedWord) return 0;
    const dx = lockedWord.x - 50;
    const dy = lockedWord.y - 91;
    const deg = Math.atan2(dx, -dy) * (180 / Math.PI);
    return Math.max(-55, Math.min(55, deg));
  }, [lockedWord]);

  const handlePlayGame = useCallback(() => {
    setAppState("deck-selection");
  }, []);

  const handleStart = useCallback(
    (deck: Deck) => {
      setSelectedDeck(deck);
      setAppState("playing");
      startGame(deck.words);
    },
    [startGame]
  );

  const handleClose = useCallback(() => {
    stopGame();
    setAppState("hub");
  }, [stopGame]);

  const handlePlayAgain = useCallback(() => {
    setAppState("playing");
    if (selectedDeck) {
      startGame(selectedDeck.words);
    } else {
      startGame();
    }
  }, [selectedDeck, startGame]);

  const handleBackToDecks = useCallback(() => {
    setAppState("deck-selection");
  }, []);

  // Keyboard handler for game
  useEffect(() => {
    if (appState !== "playing") return;

    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length !== 1) return;

      e.preventDefault();
      handleKeyPress(e.key);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [appState, handleKeyPress]);

  if (appState === "playing" || appState === "gameover") {
    return (
      <div className="game-container">
        <GameCanvas
          words={words}
          lasers={lasers}
          aimAngle={aimAngle}
          firing={firing}
        />
        <GameHUD
          score={score}
          lives={lives}
          milestone={milestone}
          combo={combo}
          deckName={selectedDeck?.name || ""}
          wordsDestroyed={wordsDestroyed}
        />
        <RightToolbar
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          onClose={handleClose}
        />
        <BottomBar deckName={selectedDeck?.name || ""} />

        {(appState === "gameover" || gameStatus === "gameover") && (
          <GameOverScreen
            score={score}
            wordsDestroyed={wordsDestroyed}
            maxCombo={maxCombo}
            totalTyped={totalTyped}
            correctTyped={correctTyped}
            missedWords={missedWords}
            onPlayAgain={handlePlayAgain}
            onBack={handleBackToDecks}
          />
        )}
      </div>
    );
  }

  // App Layout for Hub, Deck Selection and Shadowing
  return (
    <div className="app-layout">
      <TopBanner />
      <div className="app-main-wrapper">
        <Sidebar
          activeKey={appState.startsWith("shadowing") ? "shadowing" : "games"}
          onNavigate={(key: NavKey) => {
            rec.abort();
            setAppState(key === "shadowing" ? "shadowing-setup" : "hub");
          }}
        />
        <div className="app-content-area">
          <Header />
          <main className="app-main-content">
            {appState === "hub" && <GameHub onPlayGame={handlePlayGame} />}
            {appState === "shadowing-setup" && (
              <ShadowingSetup
                supported={rec.supported}
                onStart={(items, videoId) => {
                  setShadowItems(items);
                  setShadowVideoId(videoId);
                  setAppState("shadowing");
                }}
              />
            )}
            {appState === "shadowing" && (
              <ShadowingScreen
                items={shadowItems}
                videoId={shadowVideoId}
                supported={rec.supported}
                listening={rec.listening}
                transcript={rec.transcript}
                error={rec.error}
                onStartRec={rec.start}
                onStopRec={rec.stop}
                onResetRec={rec.reset}
                onAbortRec={rec.abort}
                onSpeak={speakWord}
                onBack={() => {
                  rec.abort();
                  setAppState("shadowing-setup");
                }}
              />
            )}
            {appState === "deck-selection" && (
              <div className="deck-selection-wrapper">
                <button
                  className="back-to-hub-btn"
                  onClick={() => setAppState("hub")}
                >
                  &larr; Quay lại các game
                </button>
                <DeckSelection decks={decks} onStart={handleStart} />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
