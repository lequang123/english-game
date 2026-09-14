"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VocabularyWord } from "@/data/vocabulary";

export interface FallingWord {
  id: string;
  word: string;
  meaning: string;
  phonetic: string;
  x: number;
  y: number;
  speed: number; // percentage per second
  locked: boolean;
  typedCount: number;
  destroyed: boolean;
  destroyedAt?: number;
  missed: boolean;
  missedAt?: number;
}

export type GameStatus = "idle" | "playing" | "paused" | "gameover";

interface GameState {
  words: FallingWord[];
  score: number;
  lives: number;
  combo: number;
  maxCombo: number;
  milestone: number;
  wordsDestroyed: number;
  wordsMissed: number;
  totalTyped: number;
  correctTyped: number;
  missedWords: VocabularyWord[];
  gameStatus: GameStatus;
}

const INITIAL_STATE: GameState = {
  words: [],
  score: 0,
  lives: 3,
  combo: 0,
  maxCombo: 0,
  milestone: 1,
  wordsDestroyed: 0,
  wordsMissed: 0,
  totalTyped: 0,
  correctTyped: 0,
  missedWords: [],
  gameStatus: "idle",
};

const WORDS_PER_MILESTONE = 20;

// Speed is now in percentage per second (%/s).
// At base speed 6.0%/s, a word takes ~14 seconds to fall from 6% to 90%.
const BASE_SPEED = 6.0;
const SPEED_INCREMENT = 0.8;

// Spawn every 3.2 seconds at milestone 1 down to 1.6 seconds at higher milestones
const BASE_SPAWN_INTERVAL = 3200;
const MIN_SPAWN_INTERVAL = 1600;

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getSpawnInterval(milestone: number) {
  return Math.max(MIN_SPAWN_INTERVAL, BASE_SPAWN_INTERVAL - (milestone - 1) * 200);
}

function getWordSpeed(milestone: number) {
  return BASE_SPEED + (milestone - 1) * SPEED_INCREMENT;
}

export interface TypeEvent {
  targetX: number;
  targetY: number;
  char: string;
}

export function useGameEngine(
  vocabulary: VocabularyWord[],
  callbacks: {
    onType?: (event?: TypeEvent) => void;
    onDestroy?: (word: FallingWord) => void;
    onMiss?: () => void;
    onLevelUp?: () => void;
    onGameOver?: () => void;
  }
) {
  const [state, setState] = useState<GameState>(INITIAL_STATE);

  // Mutable refs so loop always has fresh data without stale closures
  const stateRef = useRef(state);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  const wordPoolRef = useRef<VocabularyWord[]>([]);
  const wordIndexRef = useRef(0);
  const vocabRef = useRef(vocabulary);
  const callbacksRef = useRef(callbacks);

  // Sync refs synchronously every render
  stateRef.current = state;
  vocabRef.current = vocabulary;
  callbacksRef.current = callbacks;

  const gameLoopRef = useRef<((timestamp: number) => void) | null>(null);

  gameLoopRef.current = (timestamp: number) => {
    const s = stateRef.current;
    if (s.gameStatus !== "playing") return;

    // Delta-time in seconds (clamped to 100ms max to prevent jumps when switching tabs)
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
    }
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = timestamp;

    // Check if new word should spawn
    const spawnInterval = getSpawnInterval(s.milestone);
    let spawnedWord: FallingWord | null = null;

    if (timestamp - lastSpawnRef.current > spawnInterval) {
      const currentVocab = vocabRef.current;
      if (currentVocab && currentVocab.length > 0) {
        if (wordIndexRef.current >= wordPoolRef.current.length) {
          wordPoolRef.current = shuffleArray(currentVocab);
          wordIndexRef.current = 0;
        }

        const vocabWord = wordPoolRef.current[wordIndexRef.current++];
        if (vocabWord) {
          const speed = getWordSpeed(s.milestone);
          const existingXs = s.words
            .filter((w) => !w.destroyed && !w.missed)
            .map((w) => w.x);
          let x: number;
          let attempts = 0;
          do {
            x = 8 + Math.random() * 64;
            attempts++;
          } while (attempts < 10 && existingXs.some((ex) => Math.abs(ex - x) < 16));

          spawnedWord = {
            id: `word-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            word: vocabWord.word,
            meaning: vocabWord.meaning,
            phonetic: vocabWord.phonetic,
            x,
            y: 4, // starts gently right below top HUD
            speed: speed + (Math.random() - 0.5) * 0.8,
            locked: false,
            typedCount: 0,
            destroyed: false,
            missed: false,
          };
        }
      }
      lastSpawnRef.current = timestamp;
    }

    // Single unified state update per frame
    setState((prev) => {
      let newLives = prev.lives;
      let newWordsMissed = prev.wordsMissed;
      const newMissedWords = [...prev.missedWords];
      let missed = false;

      // Update positions of existing words
      const currentWords = spawnedWord ? [...prev.words, spawnedWord] : prev.words;

      const updatedWords = currentWords.map((w) => {
        if (w.destroyed || w.missed) return w;

        const newY = w.y + w.speed * dt;

        // Reaching the danger line (~88%) triggers miss
        if (newY >= 88) {
          newLives--;
          newWordsMissed++;
          newMissedWords.push({
            word: w.word,
            meaning: w.meaning,
            phonetic: w.phonetic,
            category: "",
          });
          missed = true;
          return {
            ...w,
            y: newY,
            missed: true,
            missedAt: timestamp,
          };
        }
        return { ...w, y: newY };
      });

      if (missed) {
        setTimeout(() => callbacksRef.current.onMiss?.(), 0);
      }
      const gameOver = newLives <= 0;
      if (gameOver) {
        setTimeout(() => callbacksRef.current.onGameOver?.(), 0);
      }

      // Cleanup: remove destroyed words after 1600ms (so user can read translation and hear audio)
      // and missed words after 1800ms (translation popup done)
      const cleanedWords = updatedWords.filter((w) => {
        if (w.destroyed && w.destroyedAt && timestamp - w.destroyedAt > 1600) {
          return false;
        }
        if (w.missed && w.missedAt && timestamp - w.missedAt > 1800) {
          return false;
        }
        return true;
      });

      return {
        ...prev,
        words: cleanedWords,
        lives: Math.max(0, newLives),
        wordsMissed: newWordsMissed,
        missedWords: newMissedWords,
        combo: missed ? 0 : prev.combo,
        gameStatus: gameOver ? "gameover" : "playing",
      };
    });

    animationRef.current = requestAnimationFrame((ts) => gameLoopRef.current?.(ts));
  };

  const startGame = useCallback((overrideVocab?: VocabularyWord[]) => {
    const targetVocab =
      overrideVocab && overrideVocab.length > 0
        ? overrideVocab
        : vocabRef.current.length > 0
          ? vocabRef.current
          : [];

    if (targetVocab.length === 0) return;

    cancelAnimationFrame(animationRef.current);

    wordPoolRef.current = shuffleArray(targetVocab);
    wordIndexRef.current = 0;
    lastSpawnRef.current = 0;
    lastTimeRef.current = 0;

    const newState: GameState = { ...INITIAL_STATE, gameStatus: "playing" };

    stateRef.current = newState;
    setState(newState);

    animationRef.current = requestAnimationFrame((ts) => gameLoopRef.current?.(ts));
  }, []);

  const stopGame = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
    setState((prev) => ({ ...prev, gameStatus: "gameover" }));
  }, []);

  const handleKeyPress = useCallback((key: string) => {
    const s = stateRef.current;
    if (s.gameStatus !== "playing") return;

    const lowerKey = key.toLowerCase();
    const cbs = callbacksRef.current;
    const now = performance.now();

    setState((prev) => {
      const activeWords = prev.words.filter((w) => !w.destroyed && !w.missed);
      const lockedWord = activeWords.find((w) => w.locked);

      const totalTyped = prev.totalTyped + 1;
      let correctTyped = prev.correctTyped;

      if (lockedWord) {
        const nextChar = lockedWord.word[lockedWord.typedCount]?.toLowerCase();
        if (lowerKey === nextChar) {
          correctTyped++;
          setTimeout(
            () =>
              cbs.onType?.({
                targetX: lockedWord.x,
                targetY: lockedWord.y,
                char: nextChar,
              }),
            0
          );
          const newTypedCount = lockedWord.typedCount + 1;

          if (newTypedCount >= lockedWord.word.length) {
            setTimeout(
              () =>
                cbs.onDestroy?.({
                  ...lockedWord,
                  destroyed: true,
                  typedCount: newTypedCount,
                }),
              0
            );
            const newCombo = prev.combo + 1;
            const comboBonus = Math.floor(newCombo / 5) * 10;
            const scoreGain = 10 + comboBonus;
            const newWordsDestroyed = prev.wordsDestroyed + 1;
            const newMilestone = Math.floor(newWordsDestroyed / WORDS_PER_MILESTONE) + 1;

            if (newMilestone > prev.milestone) {
              setTimeout(() => cbs.onLevelUp?.(), 0);
            }

            return {
              ...prev,
              words: prev.words.map((w) =>
                w.id === lockedWord.id
                  ? { ...w, destroyed: true, destroyedAt: now, typedCount: newTypedCount }
                  : w
              ),
              score: prev.score + scoreGain,
              combo: newCombo,
              maxCombo: Math.max(prev.maxCombo, newCombo),
              wordsDestroyed: newWordsDestroyed,
              milestone: newMilestone,
              totalTyped,
              correctTyped,
            };
          }

          return {
            ...prev,
            words: prev.words.map((w) =>
              w.id === lockedWord.id ? { ...w, typedCount: newTypedCount } : w
            ),
            totalTyped,
            correctTyped,
          };
        }
        return { ...prev, totalTyped };
      }

      // No word currently locked: find matching word closest to bottom
      const matchingWord = activeWords
        .sort((a, b) => b.y - a.y)
        .find((w) => w.word[0]?.toLowerCase() === lowerKey);

      if (matchingWord) {
        correctTyped++;
        setTimeout(
          () =>
            cbs.onType?.({
              targetX: matchingWord.x,
              targetY: matchingWord.y,
              char: lowerKey,
            }),
          0
        );

        if (matchingWord.word.length === 1) {
          setTimeout(
            () =>
              cbs.onDestroy?.({
                ...matchingWord,
                destroyed: true,
                typedCount: 1,
              }),
            0
          );
          const newCombo = prev.combo + 1;
          const scoreGain = 10;
          const newWordsDestroyed = prev.wordsDestroyed + 1;
          const newMilestone = Math.floor(newWordsDestroyed / WORDS_PER_MILESTONE) + 1;

          if (newMilestone > prev.milestone) {
            setTimeout(() => cbs.onLevelUp?.(), 0);
          }

          return {
            ...prev,
            words: prev.words.map((w) =>
              w.id === matchingWord.id
                ? { ...w, destroyed: true, destroyedAt: now, typedCount: 1 }
                : w
            ),
            score: prev.score + scoreGain,
            combo: newCombo,
            maxCombo: Math.max(prev.maxCombo, newCombo),
            wordsDestroyed: newWordsDestroyed,
            milestone: newMilestone,
            totalTyped,
            correctTyped,
          };
        }

        return {
          ...prev,
          words: prev.words.map((w) =>
            w.id === matchingWord.id ? { ...w, locked: true, typedCount: 1 } : w
          ),
          totalTyped,
          correctTyped,
        };
      }

      return { ...prev, totalTyped };
    });
  }, []);

  // Cleanup loop on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return {
    ...state,
    startGame,
    stopGame,
    handleKeyPress,
  };
}
