"use client";

import { useState } from "react";
import { splitSentences, SentenceItem } from "@/lib/shadowing";

const STORAGE_KEY = "shadowing:text";
const URL_KEY = "shadowing:url";

const SAMPLE = `If things don't work out, you can always come home. | Nếu mọi chuyện không suôn sẻ, con luôn có thể về nhà
And come back a failure? | Và trở về trong thất bại sao
What a cool witch. | Một phù thủy ngầu thật`;

interface Props {
  supported: boolean;
  onStart: (items: SentenceItem[], videoId?: string) => void;
}

type Mode = "youtube" | "text";

export default function ShadowingSetup({ supported, onStart }: Props) {
  const [mode, setMode] = useState<Mode>("youtube");
  const [text, setText] = useState(() => localStorage.getItem(STORAGE_KEY) ?? "");
  const [url, setUrl] = useState(() => localStorage.getItem(URL_KEY) ?? "");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);


  const items = splitSentences(text);

  const startText = () => {
    localStorage.setItem(STORAGE_KEY, text);
    onStart(items);
  };

  const startYoutube = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/transcript?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data.error ?? "Không lấy được phụ đề.");
        return;
      }
      localStorage.setItem(URL_KEY, url.trim());
      onStart(data.items as SentenceItem[], data.videoId as string);
    } catch {
      setFetchError("Không kết nối được máy chủ. Thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shadow-setup">
      <h1 className="shadow-setup-title">Shadowing</h1>
      <p className="shadow-setup-lead">
        Nghe từng câu, nói theo, rồi xem từ nào máy nghe đúng. Dùng clip YouTube có phụ đề tiếng Anh hoặc tự dán hội thoại.
      </p>

      {!supported && (
        <div className="shadow-alert" role="alert">
          Trình duyệt này chưa hỗ trợ nhận dạng giọng nói. Hãy mở bằng Chrome hoặc Edge để ghi âm.
        </div>
      )}

      <div className="shadow-tabs" role="tablist">
        <button role="tab" aria-selected={mode === "youtube"} className={`shadow-tab ${mode === "youtube" ? "active" : ""}`} onClick={() => setMode("youtube")}>
          Link YouTube
        </button>
        <button role="tab" aria-selected={mode === "text"} className={`shadow-tab ${mode === "text" ? "active" : ""}`} onClick={() => setMode("text")}>
          Dán hội thoại
        </button>
      </div>

      {mode === "youtube" ? (
        <>
          <label className="shadow-label" htmlFor="shadow-url">
            Link video YouTube
          </label>
          <input
            id="shadow-url"
            className="shadow-input"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && url.trim() && !loading && startYoutube()}
            placeholder="https://www.youtube.com/watch?v=..."
            spellCheck={false}
          />
          <p className="shadow-hint">
            Video cần có phụ đề tiếng Anh (do người đăng hoặc tự động). Phụ đề được tách thành từng câu theo thời gian của clip.
          </p>
          {fetchError && (
            <div className="shadow-alert" role="alert">
              {fetchError}
            </div>
          )}
          <div className="shadow-setup-actions">
            <button className="shadow-btn shadow-btn-primary" disabled={!url.trim() || loading} onClick={startYoutube}>
              {loading ? "Đang lấy phụ đề..." : "Lấy hội thoại và bắt đầu"}
            </button>
          </div>
        </>
      ) : (
        <>
          <label className="shadow-label" htmlFor="shadow-input">
            Hội thoại tiếng Anh
          </label>
          <textarea
            id="shadow-input"
            className="shadow-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={SAMPLE}
            rows={10}
            spellCheck={false}
          />
          <p className="shadow-hint">
            Mỗi dòng một câu. Thêm bản dịch bằng dấu <code>|</code>: <code>English sentence | Bản dịch tiếng Việt</code>. Tên người
            nói như <code>A:</code> sẽ được bỏ khi chấm.
          </p>
          <div className="shadow-setup-actions">
            <button className="shadow-btn shadow-btn-ghost" onClick={() => setText(SAMPLE)}>
              Dùng bài mẫu
            </button>
            <button className="shadow-btn shadow-btn-primary" disabled={items.length === 0} onClick={startText}>
              Bắt đầu luyện{items.length > 0 ? ` (${items.length} câu)` : ""}
            </button>
          </div>
        </>
      )}

      <p className="shadow-note">
        Nhận dạng giọng nói chỉ cho biết máy có nghe ra đúng từ hay không, không chấm từng âm. Chrome gửi âm thanh lên Google để xử lý.
      </p>
    </div>
  );
}
