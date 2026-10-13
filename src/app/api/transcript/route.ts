import { fetchTranscript } from "youtube-transcript-plus";
import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";
import { POS_MAP, TokenInfo, SentenceItem } from "@/lib/shadowing";

export const runtime = "nodejs";

const nlp = winkNLP(model);
const { its } = nlp;

type Raw = { text: string; duration: number; offset: number };

function extractVideoId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1, 12) || null;
    if (u.searchParams.get("v")) return u.searchParams.get("v")!.slice(0, 11);
    const m = u.pathname.match(/\/(?:embed|shorts|live)\/([\w-]{11})/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function decode(t: string) {
  return t
    .replace(/&amp;#39;|&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\[[^\]]*\]|\([^\)]*\)/g, "") // Bỏ [Music], (Laughter)...
    .replace(/\s+/g, " ")
    .trim();
}

/** Trích xuất chi tiết từng từ: từ loại (POS) và dạng gốc (Lemma) bằng wink-nlp */
export function extractTokens(text: string): TokenInfo[] {
  if (!text.trim()) return [];
  const doc = nlp.readDoc(text);
  const tokens: TokenInfo[] = [];
  doc.tokens().each((t: any) => {
    if (t.out(its.type) === "word") {
      const pos = (t.out(its.pos) as string) || "X";
      tokens.push({
        word: t.out(),
        pos,
        posLabel: POS_MAP[pos] || pos,
        lemma: (t.out(its.lemma) as string) || t.out().toLowerCase(),
      });
    }
  });
  return tokens;
}

// Chuẩn hóa thời gian về giây
function toSeconds(raw: Raw[]): { text: string; start: number; end: number }[] {
  const looksMs = raw.some((r) => r.duration > 100) || (raw.length > 3 && raw[raw.length - 1].offset > 3600 * 4);
  const k = looksMs ? 1000 : 1;
  return raw
    .map((r) => ({ text: decode(r.text), start: r.offset / k, end: (r.offset + r.duration) / k }))
    .filter((r) => r.text);
}

const DANGLING_POS = new Set(["DET", "CCONJ", "SCONJ", "PART"]);
const DANGLING_WORDS = new Set([
  "the", "a", "an", "this", "that", "these", "those", "my", "your", "his", "her", "its", "our", "their",
  "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "shall", "should", "may", "might", "must", "can", "could",
  "and", "or", "but", "nor", "yet", "because", "although", "since", "unless", "while", "whereas", "if",
  "not", "no", "very", "too", "more", "most", "such", "just", "than", "as"
]);

const STRANDING_PREPOSITIONS = new Set(["of", "to", "for", "with", "on", "at", "from", "by", "about", "in"]);

// Không ngắt câu nếu từ tiếp theo là từ bổ nghĩa tiếp diễn (preposition, relative pronoun, than...)
const CONTINUATION_WORDS = new Set([
  "in", "on", "at", "of", "to", "for", "with", "by", "from", "about", "into", "than", "which", "whom", "whose"
]);

const CLAUSE_STARTERS = new Set([
  "so", "now", "then", "well", "first", "firstly", "second", "secondly", "next", "finally", "today", "actually", "meanwhile", "furthermore", "moreover", "however", "therefore",
]);

const SUBJECT_PRONOUNS = new Set([
  "i", "you", "he", "she", "it", "we", "they", "there", "this", "that", "these", "those",
]);

/** Kiểm tra câu có kết thúc hợp lý về ngữ pháp không (chống ngắt cụt câu) */
function canEndSentence(text: string, nextStartsNewClause = false): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const clean = trimmed.replace(/[.,!?;:…\-–—]+$/, "").trim();
  if (!clean) return false;

  const doc = nlp.readDoc(clean);
  const words = doc.tokens().filter((t: any) => t.out(its.type) === "word");
  const count = words.length();
  if (count === 0) return false;

  const lastToken = words.itemAt(count - 1);
  const lastWord = lastToken.out().toLowerCase();
  const lastPos = lastToken.out(its.pos);

  // Không ngắt sau mạo từ, liên từ, trợ động từ
  if (DANGLING_POS.has(lastPos) || DANGLING_WORDS.has(lastWord)) {
    return false;
  }

  // Giới từ: Chỉ cho phép ngắt nếu là phrasal verb stranding (thinking of...) và câu sau bắt đầu mệnh đề mới
  if (STRANDING_PREPOSITIONS.has(lastWord) || lastPos === "ADP") {
    if (nextStartsNewClause && count >= 5) {
      return true;
    }
    return false;
  }

  return true;
}

/** Kiểm tra từ tiếp theo có phải là từ bổ nghĩa nối tiếp của câu trước không */
function startsContinuation(text: string, curWords: number): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase() || "";
  // Nếu câu hiện tại chưa quá dài (< 11 từ), từ bổ nghĩa tiếp diễn sẽ được gộp vào
  if (curWords < 11 && CONTINUATION_WORDS.has(firstWord)) {
    return true;
  }
  return false;
}

/** Nhận diện mảnh tiếp theo có bắt đầu một mệnh đề hoặc ý mới không */
function startsNewClause(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const cleaned = trimmed.replace(/^(and|but|or|so)\s+/i, "").trim();
  if (!cleaned) return false;

  const doc = nlp.readDoc(cleaned);
  const words = doc.tokens().filter((t: any) => t.out(its.type) === "word");
  if (words.length() === 0) return false;

  const firstWord = words.itemAt(0).out().toLowerCase();
  if (CLAUSE_STARTERS.has(firstWord)) return true;

  // Cặp Chủ ngữ (Pronoun) + Động từ (Verb / Aux): "I think", "we have", "you can", "it is"...
  if (SUBJECT_PRONOUNS.has(firstWord) && words.length() >= 2) {
    const secondPos = words.itemAt(1).out(its.pos);
    if (["VERB", "AUX"].includes(secondPos)) return true;
  }
  return false;
}

/** Tách các fragment nội bộ bằng wink-nlp nếu có nhiều câu gộp trong 1 fragment */
function splitInternalSentences(items: { text: string; start: number; end: number }[]) {
  const frags: { text: string; start: number; end: number }[] = [];
  for (const item of items) {
    const doc = nlp.readDoc(item.text);
    const sentences = doc.sentences().out();

    if (sentences.length > 1) {
      let curStart = item.start;
      const totalLen = item.text.length;
      const dur = item.end - item.start;
      for (const sent of sentences) {
        const sentDur = (sent.length / totalLen) * dur;
        frags.push({ text: sent, start: curStart, end: curStart + sentDur });
        curStart += sentDur;
      }
    } else {
      frags.push(item);
    }
  }
  return frags;
}

/**
 * Gộp thông minh các mảnh phụ đề YouTube bằng wink-nlp & luật ngữ pháp:
 * - Chuẩn hóa ngữ pháp và chống ngắt cụt câu (không để dangling prepositions/determiners/auxiliaries)
 * - Tự động tách câu chuẩn theo mệnh đề mới (Subject + Verb) và khoảng ngừng tự nhiên
 * - Tách câu vừa vặn cho một lượt Shadowing (6-10 từ hoặc 3.5-4.5s)
 * - Tôn trọng chữ viết tắt, số thập phân và các liên từ
 */
function smartMergeSentences(rawFrags: { text: string; start: number; end: number }[]): SentenceItem[] {
  const frags = splitInternalSentences(rawFrags);
  const rawSentences: { text: string; start: number; end: number }[] = [];
  let cur: { text: string; start: number; end: number } | null = null;

  for (const f of frags) {
    if (!cur) {
      cur = { ...f };
      continue;
    }

    const pause = f.start - cur.end;
    const curWords = cur.text.trim().split(/\s+/).length;
    const curDuration = cur.end - cur.start;
    const newClause = startsNewClause(f.text);
    const canEnd = canEndSentence(cur.text, newClause);
    const isContinuation = startsContinuation(f.text, curWords);
    const hasPunctuation = /[.!?…]$/.test(cur.text.trim());

    let shouldSplit = false;

    if (hasPunctuation) {
      // Phụ đề có dấu câu hoàn chỉnh
      shouldSplit = canEnd && (curWords >= 3 || pause >= 0.25);
    } else if (canEnd && !isContinuation) {
      // Phụ đề tự động (auto-captions không dấu câu):
      if (pause >= 0.45 && curWords >= 4) {
        // Khoảng ngừng nói tự nhiên >= 0.45s và câu đã đủ tối thiểu 4 từ
        shouldSplit = true;
      } else if (newClause && curWords >= 5 && pause >= 0.1) {
        // Mệnh đề độc lập mới (Subject + Verb) hoặc từ chuyển ý
        shouldSplit = true;
      } else if (curWords >= 8 || curDuration >= 4.0) {
        // Độ dài tiêu chuẩn vàng cho 1 lượt shadowing (8-10 từ hoặc ~4s)
        shouldSplit = true;
      }
    } else if (curWords >= 14 || curDuration >= 6.0) {
      // Hard fallback: Quá dài cho 1 câu Shadowing, buộc phải ngắt nếu ngữ pháp cho phép
      if (!isContinuation && canEnd) {
        shouldSplit = true;
      }
    }

    if (shouldSplit) {
      rawSentences.push(cur);
      cur = { ...f };
    } else {
      cur.text += " " + f.text;
      cur.end = f.end;
    }
  }
  if (cur) rawSentences.push(cur);

  // Bổ sung phân tích từ loại POS và dạng gốc Lemma cho từng câu
  return rawSentences.map((s) => ({
    ...s,
    tokens: extractTokens(s.text),
  }));
}

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url") ?? "";
  const videoId = extractVideoId(url);
  if (!videoId) return Response.json({ error: "Link YouTube không hợp lệ." }, { status: 400 });

  let raw: Raw[];
  try {
    raw = (await fetchTranscript(videoId, { lang: "en" })) as unknown as Raw[];
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    const noCaptions = /disabled|not available|no transcript|could not/i.test(msg);
    return Response.json(
      {
        error: noCaptions
          ? "Video này không có phụ đề tiếng Anh nên không lấy được hội thoại. Hãy thử video khác hoặc dán hội thoại thủ công."
          : "Không lấy được phụ đề từ YouTube. Thử lại sau hoặc dán hội thoại thủ công.",
      },
      { status: 422 }
    );
  }

  const items = smartMergeSentences(toSeconds(raw));
  if (items.length === 0) return Response.json({ error: "Phụ đề trống." }, { status: 422 });

  // Bản dịch tiếng Việt (nếu video có), ghép theo thời gian tương ứng
  try {
    const vi = toSeconds((await fetchTranscript(videoId, { lang: "vi" })) as unknown as Raw[]);
    if (vi.length) {
      const merged: SentenceItem[] = items.map((it) => ({
        ...it,
        translation:
          vi
            .filter((v) => v.start! >= it.start! - 0.4 && v.start! < it.end! + 0.2)
            .map((v) => v.text)
            .join(" ") || undefined,
      }));
      return Response.json({ videoId, items: merged });
    }
  } catch {
    /* không có phụ đề tiếng Việt */
  }
  return Response.json({ videoId, items });
}
