import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";
import { POS_MAP, TokenInfo } from "@/lib/shadowing";

export const runtime = "nodejs";

const nlp = winkNLP(model);
const { its } = nlp;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) {
      return Response.json({ sentences: [], tokens: [] });
    }

    const doc = nlp.readDoc(text);
    const sentences = doc.sentences().out();
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

    return Response.json({
      sentences,
      tokens,
    });
  } catch (err) {
    return Response.json({ error: "Lỗi xử lý NLP" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const text = url.searchParams.get("text") || "";
  if (!text.trim()) {
    return Response.json({ sentences: [], tokens: [] });
  }

  const doc = nlp.readDoc(text);
  const sentences = doc.sentences().out();
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

  return Response.json({
    sentences,
    tokens,
  });
}
