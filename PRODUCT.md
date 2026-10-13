# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Vietnamese learners of English (school-age to adult) practicing vocabulary in short, casual sessions (~5 minutes), mainly on desktop with a keyboard.

## Product Purpose
A hub of arcade-style mini-games that teach English vocabulary. Success: learners come back for quick rounds and retain words ("Chơi 5 phút, nhớ từ cả tuần").

## Positioning
Vocabulary is the game mechanic itself (typing falling words, recall, spelling), not flashcards with a game skin.

## Operating Context
Learner opens the hub, picks a mini-game, picks a vocabulary deck (e.g. Family), and plays a timed round.

## Capabilities and Constraints
- UI copy stays in Vietnamese; vocabulary entries carry word, Vietnamese meaning, IPA phonetic, category.
- Hub lists 8 games; only "Luyện Gõ" (falling-word typing, single player, deck selection) is implemented. The rest show a "coming soon" alert.
- Next.js 16 + React 19 + TypeScript, plain CSS (existing codebase).
- Undecided: accounts/backend, online 1v1 mode, progress tracking, mobile support priority.

## Brand Commitments
Hub tagline: "Game học tiếng Anh" / "Chơi 5 phút, nhớ từ cả tuần". Game names are Vietnamese (Đấu Trường Từ Vựng, Luyện Gõ, Mưa Từ Vựng, Ong Chính Tả, Ném Hoa Quả, Vẹt Bay Trên Mây, Xây Cầu, Nối Từ).

## Evidence on Hand
Vocabulary decks in `src/data/vocabulary.ts`. No testimonials, user counts, leaderboards, or benchmarks exist; do not fabricate them.

## Product Principles
1. Learning happens through play; the mechanic must exercise recall, not just recognition.
2. Sessions are short and instantly restartable.
3. Vietnamese-first copy and clarity for learners.
4. Show only what exists; unbuilt games are honestly marked as coming soon.
