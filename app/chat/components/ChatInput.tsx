"use client";

import { useEffect, useRef, useState } from "react";

function SendIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22 11 13 2 9 22 2z" />
    </svg>
  );
}

export default function ChatInput({
  onSend,
}: {
  onSend: (text: string) => void;
}) {

  const handleSend = () => {
  const textarea = textareaRef.current;
  if (!textarea) return;

  const value = textarea.value.trim();
  if (!value) return;

  onSend(value);

  // reset textarea
  textarea.value = "";
  textarea.style.height = "40px";
  setExpanded(false);
};

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleInput = () => {
      // RESET TOTAL saat kosong (Ctrl+X / Delete / Backspace)
      if (textarea.value.trim().length === 0) {
        textarea.style.height = "40px";
        setExpanded(false);
        return;
      }

      // auto resize
      textarea.style.height = "40px";
      textarea.style.height = textarea.scrollHeight + "px";

      setExpanded(textarea.scrollHeight > 40);
    };

    textarea.addEventListener("input", handleInput);
    return () => textarea.removeEventListener("input", handleInput);
  }, []);

  return (
    <div
      className={`
        relative bottom-4 w-full bg-[#2f2f2f] rounded-4xl
        overflow-hidden
        ${expanded ? "h-auto pt-2 pb-12" : "h-[56px]"}
      `}
    >
      {/* BUTTON + */}
      <button className="absolute left-2 bottom-2 z-10 w-10 h-10 rounded-full text-xl 
      flex items-center justify-center
      text-gray-300 hover:text-white hover:bg-white/10">
        +
      </button>

      {/* TEXTAREA */}
      <textarea
        ref={textareaRef}
        rows={1}
        placeholder="Ask anything..."
        className={`
          chat-scroll
          bg-[#2f2f2f]
          min-h-[40px] max-h-[140px]
          py-2 outline-none resize-none overflow-y-auto
          rounded-tl-4xl rounded-bl-4xl
          transition-all duration-200 ease-in-out
          ${
            expanded
              ? "pl-5 pr-1 mb-2 w-[99%]"
              : "absolute bottom-2 w-full pl-13 pr-18"
          }
        `}
      />

      {/* MIC — TRANSPARENT */}
      <button
        className="
          absolute right-13 bottom-2 z-10
          w-10 h-10 rounded-full
          flex items-center justify-center
          text-gray-300
          hover:text-white hover:bg-white/10
          transition
        "
      >
        <i className="fa-solid fa-microphone text-lg"></i>
      </button>

      {/* SEND — PURPLE + INDIGO */}
      <button
      onClick={handleSend}
        className="
          absolute right-2 bottom-2 z-10
          w-10 h-10 rounded-full
          flex items-center justify-center
          text-white
          bg-gradient-to-br from-purple-500 to-indigo-600
          hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30
          active:scale-95
          transition
        "
      >
        <SendIcon />
      </button>
    </div>
  );
}
