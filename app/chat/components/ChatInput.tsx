// app/chat/components/ChatInput.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, FileText } from "lucide-react";

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

/* helper: deteksi bahasa dari ekstensi file */
const getLanguageFromFile = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
      return "TypeScript";
    case "tsx":
      return "TypeScript React";
    case "js":
      return "JavaScript";
    case "jsx":
      return "JavaScript React";
    case "py":
      return "Python";
    case "java":
      return "Java";
    case "go":
      return "Go";
    case "rs":
      return "Rust";
    case "php":
      return "PHP";
    case "json":
      return "JSON";
    case "md":
      return "Markdown";
    case "html":
      return "HTML";
    case "css":
      return "CSS";
    default:
      return "File";
  }
};

type Attachment = {
  file: File;
  preview?: string; // object URL for images
};

export default function ChatInput({
  onSend,
  onOpenImage,
  onOpenFile,
}: {
  // KEEP original signature so existing code doesn't break
  onSend: (text: string) => void;
  onOpenImage?: (preview: string) => void;
  // onOpenFile: (file, index, updateCallback)
  onOpenFile?: (file: File, index: number, updateCallback?: (f: File) => void) => void;
}) {
  // existing state
  const [showActions, setShowActions] = useState(false);

  // textarea refs + expanded state (existing behavior)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [expanded, setExpanded] = useState(false);

  // panel + ref
  const plusRef = useRef<HTMLButtonElement | null>(null);

  // mic / speech state (kept)
  const [isRecord, setIsRecord] = useState(false);
  const recognitionRef = useRef<any>(null);

  // NEW: attachments state + hidden file inputs
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null); // general file picker (any file)
  const imageInputRef = useRef<HTMLInputElement | null>(null); // image-only picker (Create Image)
  const createdPreviewsRef = useRef<string[]>([]); // track created object URLs so we can revoke on unmount

  /* ---------------- SEND ---------------- */
  const handleSend = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const value = textarea.value.trim();
    if (!value && attachments.length === 0) return;

    // keep original onSend API (text only) so we do not break other code
    onSend(value);

    // NOTE: attachments are not part of onSend signature.
    // Non-breaking approach: keep logging attachments so integrator can wire upload logic
    if (attachments.length > 0) {
      // implement your upload here (FormData -> fetch / axios), or call your upload util
      console.log("Attachments to send (implement upload):", attachments.map((a) => a.file));
    }

    // reset textarea
    textarea.value = "";
    textarea.style.height = "40px";
    setExpanded(false);

    // cleanup previews
    attachments.forEach((a) => a.preview && URL.revokeObjectURL(a.preview));
    createdPreviewsRef.current = [];
    setAttachments([]);
  };

  /* ---------------- TEXTAREA AUTO-RESIZE ---------------- */
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

  /* ---------------- HANDLE CLICK OUTSIDE + PANEL + ---------------- */
  useEffect(() => {
    const close = () => setShowActions(false);
    if (showActions) {
      document.addEventListener("click", close);
    }
    return () => document.removeEventListener("click", close);
  }, [showActions]);

  /* ---------------- MICROPHONE (speech) ---------------- */
  const handleMicClick = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser");
      return;
    }

    // STOP
    if (isRecord) {
      recognitionRef.current?.stop();
      setIsRecord(false);
      return;
    }

    // START
    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID"; // ganti "en-US" kalau mau English
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.value = transcript;

      // trigger auto resize
      textarea.style.height = "40px";
      textarea.style.height = textarea.scrollHeight + "px";
      setExpanded(textarea.scrollHeight > 40);
    };

    recognition.onerror = () => {
      setIsRecord(false);
    };

    recognition.onend = () => {
      setIsRecord(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecord(true);
  };

  /* ---------------- FILE PICKER HANDLERS ---------------- */
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newAttachments: Attachment[] = Array.from(files).map((f) => {
      const preview = f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined;
      if (preview) createdPreviewsRef.current.push(preview);
      return { file: f, preview };
    });
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  // remove attachment
  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const item = prev[index];
      if (item?.preview) {
        URL.revokeObjectURL(item.preview);
        createdPreviewsRef.current = createdPreviewsRef.current.filter((p) => p !== item.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // function to replace an attachment file (used when parent modal edits file)
  const replaceAttachment = (index: number, newFile: File) => {
    setAttachments((prev) => {
      const next = [...prev];
      // revoke old preview if exists
      const old = next[index];
      if (old?.preview) {
        URL.revokeObjectURL(old.preview);
        createdPreviewsRef.current = createdPreviewsRef.current.filter((p) => p !== old.preview);
      }
      const preview = newFile.type.startsWith("image/") ? URL.createObjectURL(newFile) : undefined;
      if (preview) createdPreviewsRef.current.push(preview);
      next[index] = { ...next[index], file: newFile, preview };
      return next;
    });
  };

  // cleanup on unmount (revoke any leftover object URLs)
  useEffect(() => {
    return () => {
      createdPreviewsRef.current.forEach((p) => {
        try {
          URL.revokeObjectURL(p);
        } catch {
          // ignore
        }
      });
      createdPreviewsRef.current = [];
    };
  }, []);

  /* ---------------- RENDER ---------------- */
  return (
    <div className="w-full">
      <div
        className={`
          relative bg-[#2f2f2f] rounded-4xl
          overflow-visible border border-black/30
        `}
      >
        {/* HIDDEN file inputs (reused by panel actions) */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={(e) => {
            handleFiles(e.target.files);
            if (e.target) e.target.value = "";
          }}
        />
        <input
          ref={imageInputRef}
          type="file"
          multiple
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            handleFiles(e.target.files);
            if (e.target) e.target.value = "";
          }}
        />

        {/* ATTACHMENTS PREVIEW (top) */}
        {attachments.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              padding: "10px 12px",
              boxSizing: "border-box",
            }}
            className="rounded-t-4xl"
          >
            {attachments.map((a, idx) => {
              const isImage = a.file.type.startsWith("image/");
              const language = getLanguageFromFile(a.file.name);
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    minWidth: 72,
                    maxWidth: 140,
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: 8,
                    padding: 6,
                    position: "relative",
                    color: "#e5e7eb",
                  }}
                >
                  {/* TOP-LEFT: preview / view button */}
                  <button
                    onClick={() => {
                      if (isImage && a.preview) {
                        onOpenImage && onOpenImage(a.preview);
                      } else {
                        // provide update callback so parent can replace attachment file
                        onOpenFile && onOpenFile(a.file, idx, (newFile: File) => replaceAttachment(idx, newFile));
                      }
                    }}
                    title={isImage ? "Preview image" : "View / edit file"}
                    style={{
                      position: "absolute",
                      top: 6,
                      left: 8,
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: "#cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 4,
                      borderRadius: 6,
                    }}
                    aria-label={`Preview ${a.file.name}`}
                  >
                    {isImage ? <Eye size={16} /> : <FileText size={16} />}
                  </button>

                  <button
                    onClick={() => removeAttachment(idx)}
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 8,
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: "#cbd5e1",
                      fontSize: 12,
                      padding: 4,
                      borderRadius: 6,
                    }}
                    aria-label={`Remove ${a.file.name}`}
                  >
                    ✕
                  </button>

                  {isImage && a.preview ? (
                    <img
                      src={a.preview}
                      alt={a.file.name}
                      style={{
                        width: 72,
                        height: 72,
                        objectFit: "cover",
                        borderRadius: 6,
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(255,255,255,0.03)",
                        color: "#9ca3af",
                        fontSize: 12,
                        textAlign: "center",
                        padding: 6,
                      }}
                    >
                      <div style={{ fontSize: 11 }}>{language}</div>
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                      maxWidth: 100,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {a.file.name}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* INPUT ROW */}
        <div className="flex items-center gap-2 px-3 py-2">
          {/* + button */}
          <button
            ref={plusRef}
            onClick={(e) => {
              e.stopPropagation();
              setShowActions((v) => !v);
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10"
          >
            +
          </button>

          {/* PANEL + */}
          {showActions && plusRef.current && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "fixed",
                left: plusRef.current.getBoundingClientRect().left - 5,
                top: plusRef.current.getBoundingClientRect().top - 12,
                transform: "translateY(-100%)",
              }}
              className="z-[9999] w-50 bg-[#1f1f1f] rounded-2xl shadow-md shadow-black/40 p-2 flex flex-col gap-1"
            >
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowActions(false);
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-200 cursor-pointer hover:bg-white/10 text-left"
              >
                <i className="fa-solid fa-icons text-lg" />
                Upload Image & File
              </button>

              <button
                onClick={() => {
                  imageInputRef.current?.click();
                  setShowActions(false);
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-200 cursor-pointer hover:bg-white/10 text-left"
              >
                <i className="fa-regular fa-image text-lg" />
                Create Image
              </button>
            </div>
          )}

          {/* TEXTAREA */}
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Tanyakan apa saja"
            onKeyDown={(e) => {
              const isDesktop = window.innerWidth >= 1024;
              if (!isDesktop) return;

              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className={`
              chat-scroll
              bg-transparent
              min-h-[40px] max-h-[110px]
              py-2 outline-none resize-none overflow-y-auto
              rounded-lg
              transition-[height] duration-200 ease-in-out
              flex-1 pr-12
            `}
            style={{
              height: "40px",
            }}
          />

          {/* MIC */}
          <button
            type="button"
            aria-label="Voice input"
            onClick={handleMicClick}
            title={isRecord ? "Stop Recording" : "Start Recording"}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center text-white
              md:hover:bg-white/10
              transition active:scale-95
              ${isRecord ? `bg-red-500 md:hover:bg-red-600 active:bg-red-600` : "bg-transparent"}
            `}
          >
            <i className="fa-solid fa-microphone text-lg" />
          </button>

          {/* SEND */}
          <button
            onClick={handleSend}
            className="
              w-10 h-10 rounded-full flex items-center justify-center text-white
              bg-gradient-to-br from-purple-500 to-indigo-600
              sm:hover:scale-105 md:hover:shadow-lg md:hover:shadow-purple-500/30
              active:scale-95 active:shadow-lg active:shadow-purple-500/30
              transition
            "
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
