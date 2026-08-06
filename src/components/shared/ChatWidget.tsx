"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChatCircleDotsIcon, PaperPlaneRightIcon, RobotIcon, XIcon } from "@phosphor-icons/react/ssr";
import type { ChatMessage } from "@/lib/types";

interface ChatWidgetProps {
  storageKey: string;
  title: string;
  greeting: string;
  placeholder?: string;
  showOrderLookup?: boolean;
  positionClassName?: string;
}

interface StoredChatState {
  messages: ChatMessage[];
  orderCode?: string;
  orderPhone?: string;
}

export function ChatWidget({
  storageKey,
  title,
  greeting,
  placeholder = "Nhập câu hỏi của bạn...",
  showOrderLookup = false,
  positionClassName = "fixed bottom-24 right-4 z-30 sm:bottom-28 sm:right-6",
}: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [orderPhone, setOrderPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredChatState;
        setMessages(parsed.messages ?? []);
        setOrderCode(parsed.orderCode ?? "");
        setOrderPhone(parsed.orderPhone ?? "");
      }
    } catch {
      // corrupt localStorage - just start fresh
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload: StoredChatState = { messages, orderCode, orderPhone };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [messages, orderCode, orderPhone, hydrated, storageKey]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, loading]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          orderLookup: showOrderLookup ? { code: orderCode, phone: orderPhone } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((cur) => [
          ...cur,
          { role: "assistant", content: data.message ?? "Xin lỗi, trợ lý đang gặp sự cố." },
        ]);
      } else {
        setMessages((cur) => [...cur, { role: "assistant", content: data.reply as string }]);
      }
    } catch {
      setMessages((cur) => [
        ...cur,
        { role: "assistant", content: "Không thể kết nối máy chủ. Vui lòng thử lại." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`flex flex-col items-end gap-3 ${positionClassName}`}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-[70dvh] max-h-[560px] w-[88vw] max-w-sm flex-col overflow-hidden rounded-2xl bg-surface shadow-soft-lg"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/12 text-accent">
                  <RobotIcon size={16} weight="fill" />
                </span>
                <p className="text-sm font-semibold text-ink">{title}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMessages([])}
                  className="rounded-full px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-ink/6 hover:text-ink"
                >
                  Xoá hội thoại
                </button>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Đóng trợ lý AI"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-ink/6 hover:text-ink"
                >
                  <XIcon size={16} weight="bold" />
                </button>
              </div>
            </div>

            {showOrderLookup && (
              <div className="flex gap-2 border-b border-border px-4 py-2.5">
                <input
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                  placeholder="Mã đơn (tuỳ chọn)"
                  className="w-1/2 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-xs outline-none focus:border-accent"
                />
                <input
                  value={orderPhone}
                  onChange={(e) => setOrderPhone(e.target.value)}
                  placeholder="SĐT (tuỳ chọn)"
                  className="w-1/2 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-xs outline-none focus:border-accent"
                />
              </div>
            )}

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 && (
                <p className="mb-2 rounded-xl bg-accent/8 p-3 text-sm text-ink">{greeting}</p>
              )}
              <div className="flex flex-col gap-2.5">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "ml-auto bg-accent text-accent-ink"
                        : "mr-auto bg-ink/6 text-ink"
                    }`}
                  >
                    {m.content}
                  </div>
                ))}
                {loading && (
                  <div className="mr-auto rounded-2xl bg-ink/6 px-3.5 py-2.5 text-sm text-muted">
                    Đang trả lời...
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-border p-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={placeholder}
                className="flex-1 rounded-full border border-border bg-bg px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                aria-label="Gửi"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink transition-transform disabled:opacity-40 active:scale-95"
              >
                <PaperPlaneRightIcon size={17} weight="bold" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.92 }}
        aria-label={open ? "Đóng trợ lý AI" : "Mở trợ lý AI"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white shadow-soft-lg transition-transform"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <XIcon size={22} weight="bold" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <ChatCircleDotsIcon size={22} weight="fill" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
