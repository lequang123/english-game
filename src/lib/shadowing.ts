export type TokenInfo = {
  word: string;
  pos: string;
  posLabel: string;
  lemma: string;
};

export const POS_MAP: Record<string, string> = {
  NOUN: "Danh từ (Noun)",
  PROPN: "Tên riêng (Proper Noun)",
  VERB: "Động từ (Verb)",
  AUX: "Trợ động từ (Auxiliary)",
  ADJ: "Tính từ (Adjective)",
  ADV: "Trạng từ (Adverb)",
  PRON: "Đại từ (Pronoun)",
  DET: "Từ hạn định (Determiner)",
  ADP: "Giới từ (Preposition)",
  CONJ: "Liên từ (Conjunction)",
  CCONJ: "Liên từ kết hợp",
  SCONJ: "Liên từ phụ thuộc",
  PART: "Tiểu từ (Particle)",
  INTJ: "Thán từ (Interjection)",
  NUM: "Số từ (Number)",
  PUNCT: "Dấu câu (Punctuation)",
  SYM: "Ký hiệu (Symbol)",
  X: "Khác",
};

export type SentenceItem = {
  text: string;
  translation?: string;
  start?: number;
  end?: number;
  tokens?: TokenInfo[];
};
export type WordStatus = "correct" | "wrong" | "missing";
export type WordResult = { word: string; status: WordStatus };

const clientSegmenter =
  typeof Intl !== "undefined" && typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("en", { granularity: "sentence" })
    : null;

/** Tách câu chuẩn: hỗ trợ "English | Tiếng Việt", hoặc tự động tách từng câu nếu văn bản dài. */
export function splitSentences(raw: string): SentenceItem[] {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const out: SentenceItem[] = [];

  for (const line of lines) {
    const [left, ...rest] = line.split("|");
    const text = left.trim().replace(/^[A-Za-z][\w ]{0,15}:\s+/, "");
    const translation = rest.join("|").trim();
    if (!text) continue;

    // Nếu có bản dịch đính kèm ("EN | VI") thì giữ nguyên liên kết
    if (translation || !clientSegmenter) {
      out.push({ text, translation: translation || undefined });
      continue;
    }

    // Nếu văn bản dán vào có nhiều câu trong 1 dòng thì tách thành từng câu riêng
    const segments = Array.from(clientSegmenter.segment(text))
      .map((s) => s.segment.trim())
      .filter(Boolean);

    if (segments.length > 1) {
      for (const seg of segments) {
        out.push({ text: seg });
      }
    } else {
      out.push({ text });
    }
  }

  return out;
}

const NUMBER_WORDS: Record<string, string> = {
  "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four",
  "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten",
};

const CONTRACTIONS: Record<string, string[]> = {
  "don't": ["do", "not"], "doesn't": ["does", "not"], "didn't": ["did", "not"],
  "can't": ["can", "not"], "won't": ["will", "not"], "isn't": ["is", "not"],
  "aren't": ["are", "not"], "wasn't": ["was", "not"], "i'm": ["i", "am"],
  "it's": ["it", "is"], "that's": ["that", "is"], "i'll": ["i", "will"],
  "i've": ["i", "have"], "you're": ["you", "are"], "we're": ["we", "are"],
  "they're": ["they", "are"], "let's": ["let", "us"],
};

/** Chữ thường, bỏ dấu câu (giữ ' trong từ), mở rộng viết tắt và số nhỏ để khớp ASR. */
export function normalize(s: string): string[] {
  const tokens = s
    .toLowerCase()
    .replace(/[\u2019\u2018]/g, "'")
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^'+|'+$/g, ""))
    .filter(Boolean);
  const out: string[] = [];
  for (const t of tokens) {
    if (CONTRACTIONS[t]) out.push(...CONTRACTIONS[t]);
    else out.push(NUMBER_WORDS[t] ?? t);
  }
  return out;
}

/** Tách câu mẫu thành các từ hiển thị, giữ nguyên chữ gốc kèm dấu câu. */
export function displayWords(sentence: string): string[] {
  return sentence.split(/\s+/).filter(Boolean);
}

export function scoreSentence(target: string, heard: string) {
  const a = normalize(target);
  const b = normalize(heard);
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const words: WordResult[] = [];
  let i = 0;
  let j = 0;
  while (i < n) {
    if (j < m && a[i] === b[j]) {
      words.push({ word: a[i], status: "correct" });
      i++;
      j++;
    } else if (j < m && dp[i][j + 1] >= dp[i + 1][j]) {
      j++; // từ thừa của người nói, bỏ qua
    } else {
      words.push({ word: a[i], status: "missing" });
      i++;
    }
  }
  const correct = words.filter((w) => w.status === "correct").length;
  const percent = n === 0 ? 0 : Math.round((correct / n) * 100);
  return { words, percent, heardWords: b };
}

/**
 * Gán trạng thái cho từ hiển thị (có dấu câu): map từng từ hiển thị với các token chuẩn hóa của nó.
 */
export function statusForDisplay(sentence: string, results: WordResult[]): WordStatus[] {
  const display = displayWords(sentence);
  let k = 0;
  return display.map((d) => {
    const count = normalize(d).length;
    if (count === 0) return "correct";
    const slice = results.slice(k, k + count);
    k += count;
    return slice.every((r) => r.status === "correct") ? "correct" : "missing";
  });
}
