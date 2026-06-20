"use client";

import { useState, useRef, useEffect, useId } from "react";
import { getSetting, putSetting } from "@/lib/db";
import {
  MessageCircle,
  X,
  Send,
  Mic,
  MicOff,
  Leaf,
  HelpCircle,
  ChevronDown,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Seed messages ──────────────────────────────────────────────────── */

const SEED_MESSAGES = {
  assistant: [
    {
      id: "a1",
      role: "assistant",
      text: "Hi! I'm your Eco Assistant. Ask me anything about reducing your carbon footprint, your city's score, or your daily impact.",
    },
  ],
  help: [
    {
      id: "h1",
      role: "assistant",
      text: "Need help? Here are some things you can do on Prithvi:",
    },
    {
      id: "h2",
      role: "assistant",
      text: "• Log daily actions across Commute, Food, Energy and Waste\n• Check your city's environmental health score\n• Earn badges and level up your profile\n• Pledge to smart swaps suggested just for you",
    },
  ],
};

/* ─── Suggested quick-replies ────────────────────────────────────────── */

const QUICK_REPLIES = [
  "What's my carbon footprint today?",
  "How do I improve my city score?",
  "What are easy swaps I can make?",
];

/* ─── Message bubble ─────────────────────────────────────────────────── */

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
        "animate-in fade-in slide-in-from-bottom-2 duration-200",
      )}
    >
      {/* Assistant avatar */}
      {!isUser && (
        <span
          aria-hidden="true"
          className="mr-2 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
        >
          <Leaf className="size-3.5" />
        </span>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words",
          isUser
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-secondary text-secondary-foreground",
        )}
      >
        {message.text}
      </div>
    </div>
  );
}

/* ─── Tab pill ───────────────────────────────────────────────────────── */

function TabPill({ label, icon: Icon, active, onClick, id, panelId }) {
  return (
    <button
      id={id}
      role="tab"
      aria-selected={active}
      aria-controls={panelId}
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-secondary",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}

/* ─── ChatBubble ─────────────────────────────────────────────────────── */

/**
 * ChatBubble — a floating FAB that opens a frosted-glass chat panel.
 *
 * Desktop: fixed 320 × 480 px panel anchored bottom-right.
 * Mobile:  full-width bottom sheet.
 *
 * @param {Object}   props
 * @param {Function} [props.onSend]   — callback receiving { tab, text }
 */
export function ChatBubble({ onSend }) {
  const [open, setOpen]           = useState(false);
  const [activeTab, setActiveTab] = useState("assistant");
  const [inputValue, setInput]    = useState("");
  const [listening, setListening] = useState(false);
  const [messages, setMessages]   = useState({
    assistant: [...SEED_MESSAGES.assistant],
    help:      [...SEED_MESSAGES.help],
  });
  // Gemini API key state
  const [geminiKey, setGeminiKey]       = useState("");
  const [keyVisible, setKeyVisible]     = useState(false);
  const [keySaved, setKeySaved]         = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);

  const inputRef    = useRef(null);
  const scrollRef   = useRef(null);
  const panelRef    = useRef(null);
  const fabRef      = useRef(null);

  const tabBarId      = useId();
  const assistantPanelId = `${tabBarId}-panel-assistant`;
  const helpPanelId      = `${tabBarId}-panel-help`;

  /* ── Load Gemini key on mount ───────────────────────────────────── */
  useEffect(() => {
    getSetting("geminiApiKey", "").then((k) => {
      setGeminiKey(k || "");
      setShowKeyInput(!k); // auto-expand if key is missing
    }).catch(() => {});
  }, []);

  /* ── Save Gemini key ─────────────────────────────────────────────── */
  async function handleSaveKey() {
    const trimmed = geminiKey.trim();
    await putSetting("geminiApiKey", trimmed).catch(() => {});
    setKeySaved(true);
    if (trimmed) setShowKeyInput(false);
    setTimeout(() => setKeySaved(false), 2000);
  }

  /* ── Auto-scroll on new message ──────────────────────────────────── */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeTab, open]);

  /* ── Focus input when panel opens ───────────────────────────────── */
  useEffect(() => {
    if (open) {
      // Small tick so the animation has started
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  /* ── Close on Escape ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") {
        setOpen(false);
        fabRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  /* ── Send ─────────────────────────────────────────────────────────── */
  function handleSend() {
    const text = inputValue.trim();
    if (!text) return;

    const userMsg = { id: `u-${Date.now()}`, role: "user", text };

    // Simulated assistant reply
    const replyText =
      activeTab === "help"
        ? "For more help, visit the Prithvi community forums or tap a section in the app to explore."
        : "Great question! Every small action counts. Try logging your commute today to see your impact.";
    const assistantMsg = {
      id: `a-${Date.now() + 1}`,
      role: "assistant",
      text: replyText,
    };

    setMessages((prev) => ({
      ...prev,
      [activeTab]: [...prev[activeTab], userMsg, assistantMsg],
    }));
    setInput("");
    onSend?.({ tab: activeTab, text });
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleQuickReply(text) {
    setInput(text);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  /* ── Mic (toggle only — no Web Speech wiring to keep it portable) ── */
  function handleMic() {
    setListening((v) => !v);
  }

  /* ── Derived ─────────────────────────────────────────────────────── */
  const currentMessages = messages[activeTab];
  const panelId = activeTab === "assistant" ? assistantPanelId : helpPanelId;

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <>
      {/* ── Chat panel ─────────────────────────────────────────────── */}
      {open && (
        /* Backdrop — mobile only */
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[2px] md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        ref={panelRef}
        role="dialog"
        aria-label="Prithvi chat panel"
        aria-modal="true"
        aria-hidden={!open}
        className={cn(
          // positioning
          "fixed z-50",
          // mobile: full-width bottom sheet
          "bottom-0 left-0 right-0 mx-0 rounded-t-2xl",
          // desktop: anchored card
          "md:bottom-24 md:right-6 md:left-auto md:w-80 md:rounded-2xl",
          // surface
          "flex flex-col bg-card/80 backdrop-blur-xl border border-border shadow-2xl",
          // height
          "h-[480px] max-h-[70vh] md:h-[480px] md:max-h-none",
          // animation
          open
            ? "animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out"
            : "pointer-events-none opacity-0 translate-y-4",
          "transition-all duration-300",
        )}
      >
        {/* ── Header ───────────────────────────────────────────────── */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-primary"
            >
              <Leaf className="size-3.5" />
            </span>
            <span className="text-sm font-bold text-foreground">Prithvi AI</span>
            <span className="flex size-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
          </div>
          <button
            type="button"
            aria-label="Close chat"
            onClick={() => { setOpen(false); fabRef.current?.focus(); }}
            className={cn(
              "flex size-7 items-center justify-center rounded-full",
              "text-muted-foreground hover:bg-secondary hover:text-foreground",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <ChevronDown className="size-4" aria-hidden="true" />
          </button>
        </header>

        {/* ── Gemini API Key section ────────────────────────────────── */}
        <div className="mx-3 mt-2.5 shrink-0">
          {showKeyInput ? (
            <div className="rounded-xl bg-secondary/60 border border-border p-3 space-y-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Key className="size-3 text-primary" aria-hidden="true" />
                Gemini API Key
              </p>
              {!geminiKey && (
                <p className="text-xs text-muted-foreground">
                  Add your free API key for personalised AI eco-suggestions.{" "}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline text-primary">Get one here</a>.
                </p>
              )}
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <input
                    id="chat-gemini-key-input"
                    type={keyVisible ? "text" : "password"}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveKey(); }}
                    placeholder="AIza…"
                    autoComplete="off"
                    aria-label="Gemini API key"
                    className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-mono text-foreground pr-8 focus-visible:outline-2 focus-visible:outline-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setKeyVisible((v) => !v)}
                    aria-label={keyVisible ? "Hide key" : "Show key"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {keyVisible ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                  </button>
                </div>
                <button
                  type="button"
                  id="btn-chat-save-key"
                  onClick={handleSaveKey}
                  aria-label="Save API key"
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  {keySaved ? <CheckCircle2 className="size-3" /> : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowKeyInput(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
              aria-label={geminiKey ? "Gemini API key configured" : "Add Gemini API key"}
            >
              <Key className="size-3" aria-hidden="true" />
              {geminiKey ? (
                <span className="text-emerald-600 dark:text-emerald-400">AI key configured</span>
              ) : (
                <span>Add Gemini key for AI responses</span>
              )}
            </button>
          )}
        </div>

        {/* ── Tab bar ──────────────────────────────────────────────── */}
        <div
          role="tablist"
          aria-label="Chat sections"
          className="flex gap-1 mx-3 mt-2 mb-1 rounded-xl bg-secondary p-1 shrink-0"
        >
          <TabPill
            label="Eco Assistant"
            icon={Leaf}
            active={activeTab === "assistant"}
            onClick={() => setActiveTab("assistant")}
            id={`${tabBarId}-tab-assistant`}
            panelId={assistantPanelId}
          />
          <TabPill
            label="Help"
            icon={HelpCircle}
            active={activeTab === "help"}
            onClick={() => setActiveTab("help")}
            id={`${tabBarId}-tab-help`}
            panelId={helpPanelId}
          />
        </div>

        {/* ── Message list ─────────────────────────────────────────── */}
        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={
            activeTab === "assistant"
              ? `${tabBarId}-tab-assistant`
              : `${tabBarId}-tab-help`
          }
          ref={scrollRef}
          className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3 overscroll-contain"
        >
          {currentMessages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Quick replies — only in assistant tab and after initial message */}
          {activeTab === "assistant" && currentMessages.length <= 2 && (
            <div
              aria-label="Suggested questions"
              className="flex flex-col gap-1.5 mt-1"
            >
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => handleQuickReply(reply)}
                  className={cn(
                    "w-fit text-left text-xs px-3 py-1.5 rounded-full",
                    "border border-border text-muted-foreground bg-secondary/60",
                    "hover:bg-accent hover:text-accent-foreground hover:border-transparent",
                    "transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  {reply}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Input bar ────────────────────────────────────────────── */}
        <div className="flex items-end gap-2 border-t border-border px-3 py-2.5 shrink-0">
          {/* Mic */}
          <button
            type="button"
            aria-label={listening ? "Stop voice input" : "Start voice input"}
            aria-pressed={listening}
            onClick={handleMic}
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              listening
                ? "bg-destructive/10 text-destructive animate-pulse"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {listening
              ? <MicOff className="size-4" aria-hidden="true" />
              : <Mic  className="size-4" aria-hidden="true" />}
          </button>

          {/* Textarea */}
          <textarea
            ref={inputRef}
            rows={1}
            value={inputValue}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask something…"
            aria-label="Message input"
            className={cn(
              "flex-1 resize-none rounded-xl bg-secondary px-3 py-2",
              "text-sm text-foreground placeholder:text-muted-foreground",
              "leading-relaxed outline-none max-h-24 overflow-y-auto",
              "focus-visible:ring-2 focus-visible:ring-ring",
              "transition-shadow duration-150",
            )}
          />

          {/* Send */}
          <button
            type="button"
            aria-label="Send message"
            disabled={!inputValue.trim()}
            onClick={handleSend}
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full",
              "bg-primary text-primary-foreground",
              "transition-all duration-150",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "enabled:hover:opacity-90 enabled:active:scale-90",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <Send className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ── FAB ──────────────────────────────────────────────────────── */}
      <button
        ref={fabRef}
        type="button"
        aria-label={open ? "Close chat" : "Open Eco Assistant chat"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-20 right-4 z-50",
          "md:bottom-8 md:right-6",
          "flex size-14 items-center justify-center rounded-full",
          "bg-primary text-primary-foreground shadow-lg",
          "hover:opacity-90 active:scale-90",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          // subtle scale-in on mount
          "animate-in zoom-in-75 duration-300",
        )}
      >
        {open
          ? <X              className="size-6" aria-hidden="true" />
          : <MessageCircle  className="size-6" aria-hidden="true" />}

        {/* Unread dot */}
        {!open && (
          <span
            aria-hidden="true"
            className="absolute top-2 right-2 size-2.5 rounded-full bg-amber-400 ring-2 ring-card"
          />
        )}
      </button>
    </>
  );
}
