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
/* GANTI HANYA fungsi ini; signature tetap: (name: string) => sesuatu yang renderable */
const getLanguageFromFile = (name: string) => {
  // wrapper: icon di atas, label di bawah (centered), ukuran diperkecil
  const wrap = (icon: any, label: string) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div
        aria-hidden
        style={{
          width: 28,
          height: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 10, lineHeight: "12px", color: "inherit", userSelect: "none" }}>{label}</div>
    </div>
  );

  // smaller square-with-text helper for icons
  const svgSquareText = (bg: string, text: string, textColor = "#ffffff", fontSize = 9) => (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="24" height="24" rx="4" fill={bg} />
      <text
        x="50%"
        y="56%"
        textAnchor="middle"
        fontSize={fontSize}
        fontFamily="Arial, Helvetica, sans-serif"
        fill={textColor}
        fontWeight="700"
      >
        {text}
      </text>
    </svg>
  );

  // small custom icons (kept minimal so tidak perlu asset eksternal)
  const svgTS = svgSquareText("#007ACC", "TS", "#fff", 9);
  const svgJS = svgSquareText("#F7DF1E", "JS", "#000", 9);
  const svgPY = (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="24" height="24" rx="4" fill="#306998" />
      <path d="M7 6c0-1 1-2 2-2h6v2H9c-.6 0-1 .4-1 1v1H7V6z" fill="#FFE873" />
      <path d="M17 18c0 1-1 2-2 2H8v-2h7c.6 0 1-.4 1-1v-1h1v2z" fill="#FFD43B" />
    </svg>
  );
  const svgJava = svgSquareText("#007396", "J", "#fff", 10);
  const svgGo = svgSquareText("#00ADD8", "Go", "#fff", 8);
  const svgRust = svgSquareText("#000000", "R", "#fff", 9);
  const svgPhp = svgSquareText("#777BB4", "PHP", "#fff", 7);
  const svgRuby = svgSquareText("#CC342D", "Rb", "#fff", 8);
  const svgHtml = svgSquareText("#E34F26", "HTML", "#fff", 7);
  const svgCss = svgSquareText("#1572B6", "CSS", "#fff", 8);
  const svgJson = svgSquareText("#282C34", "JSON", "#fff", 7);
  const svgYaml = svgSquareText("#CB171E", "YML", "#fff", 8);
  const svgMarkdown = svgSquareText("#0EA5A4", "MD", "#fff", 9);
  const svgDocker = svgSquareText("#2496ED", "D", "#fff", 9);
  const svgMake = svgSquareText("#6B7280", "MF", "#fff", 8);
  const svgSql = svgSquareText("#FF6F00", "SQL", "#fff", 7);
  const svgShell = svgSquareText("#89E051", "SH", "#000", 8);
  const svgC = svgSquareText("#555555", "C", "#fff", 10);
  const svgCpp = svgSquareText("#00599C", "C++", "#fff", 7);
  const svgCs = svgSquareText("#239120", "C#", "#fff", 8);
  const svgSwift = svgSquareText("#F05138", "S", "#fff", 10);
  const svgKotlin = svgSquareText("#7F52FF", "Kt", "#fff", 8);
  const svgTSX = svgSquareText("#007ACC", "TSX", "#fff", 8);
  const svgJSX = svgSquareText("#F7DF1E", "JSX", "#000", 8);
  const svgTxt = svgSquareText("#6B7280", "TXT", "#fff", 9);
  const svgAssembly = svgSquareText("#8B5CF6", "ASM", "#fff", 8); // assembly-specific icon
  const svgNim = svgSquareText("#0077C2", "Nim", "#fff", 7);
  const svgFile = (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="currentColor" />
    </svg>
  );

  if (!name) return wrap(svgFile, "File");

  const lower = name.toLowerCase();
  const filename = lower.split("/").pop() || lower;
  const ext = lower.includes(".") ? lower.split(".").pop() || lower : lower;

  // mapping: extension or full filename => { label, icon }
  const map: Record<string, { label: string; icon: any }> = {
    // text / docs
    txt: { label: "Text", icon: svgTxt },
    text: { label: "Text", icon: svgTxt },
    md: { label: "Markdown", icon: svgMarkdown },
    markdown: { label: "Markdown", icon: svgMarkdown },
    mdx: { label: "Markdown", icon: svgMarkdown },
    rmd: { label: "R Markdown", icon: svgMarkdown },

    // markup / web
    html: { label: "HTML", icon: svgHtml },
    htm: { label: "HTML", icon: svgHtml },
    css: { label: "CSS", icon: svgCss },
    scss: { label: "SCSS", icon: svgCss },
    sass: { label: "Sass", icon: svgCss },
    less: { label: "Less", icon: svgCss },

    // javascript / typescript
    js: { label: "JavaScript", icon: svgJS },
    mjs: { label: "JavaScript", icon: svgJS },
    cjs: { label: "JavaScript", icon: svgJS },
    jsx: { label: "JavaScript React", icon: svgJSX },
    ts: { label: "TypeScript", icon: svgTS },
    tsx: { label: "TypeScript React", icon: svgTSX },

    // popular languages
    py: { label: "Python", icon: svgPY },
    python: { label: "Python", icon: svgPY },
    java: { label: "Java", icon: svgJava },
    kt: { label: "Kotlin", icon: svgKotlin },
    kts: { label: "Kotlin Script", icon: svgKotlin },
    go: { label: "Go", icon: svgGo },
    rs: { label: "Rust", icon: svgRust },
    php: { label: "PHP", icon: svgPhp },
    rb: { label: "Ruby", icon: svgRuby },
    swift: { label: "Swift", icon: svgSwift },
    cs: { label: "C#", icon: svgCs },
    cpp: { label: "C++", icon: svgCpp },
    c: { label: "C", icon: svgC },
    h: { label: "C Header", icon: svgC },
    hpp: { label: "C++ Header", icon: svgCpp },

    // shells / scripts
    sh: { label: "Shell", icon: svgShell },
    bash: { label: "Bash", icon: svgShell },
    zsh: { label: "Zsh", icon: svgShell },
    ps1: { label: "PowerShell", icon: svgShell },

    // config / data
    json: { label: "JSON", icon: svgJson },
    jsonc: { label: "JSON (with comments)", icon: svgJson },
    yaml: { label: "YAML", icon: svgYaml },
    yml: { label: "YAML", icon: svgYaml },
    xml: { label: "XML", icon: svgYaml },
    toml: { label: "TOML", icon: svgYaml },
    ini: { label: "INI", icon: svgYaml },
    env: { label: "Env", icon: svgYaml },

    // database / query
    sql: { label: "SQL", icon: svgSql },
    pgsql: { label: "PostgreSQL", icon: svgSql },
    psql: { label: "PostgreSQL", icon: svgSql },

    // logs / csv
    log: { label: "Log", icon: svgFile },
    csv: { label: "CSV", icon: svgFile },

    // notebooks & others
    ipynb: { label: "Jupyter Notebook", icon: svgMarkdown },

    // misc / tools
    dockerfile: { label: "Dockerfile", icon: svgDocker },
    docker: { label: "Dockerfile", icon: svgDocker },
    makefile: { label: "Makefile", icon: svgMake },
    gemfile: { label: "Gemfile", icon: svgRuby },
    "package.json": { label: "package.json", icon: svgJson },
    "package-lock.json": { label: "package-lock.json", icon: svgFile },
    "yarn.lock": { label: "yarn.lock", icon: svgFile },
    "pnpm-lock.yaml": { label: "pnpm-lock.yaml", icon: svgFile },

    // assembly / low-level
    asm: { label: "Assembly", icon: svgAssembly },
    s: { label: "Assembly", icon: svgAssembly },
    nasm: { label: "Assembly (NASM)", icon: svgAssembly },

    // some niche / others
    nim: { label: "Nim", icon: svgNim },

    // compiled / archives
    jar: { label: "Java Archive", icon: svgFile },
    war: { label: "Java Archive", icon: svgFile },
  };

  // special full filename mappings
  const specialFilenameMap: Record<string, { label: string; icon: any }> = {
    dockerfile: { label: "Dockerfile", icon: svgDocker },
    makefile: { label: "Makefile", icon: svgMake },
    gemfile: { label: "Gemfile", icon: svgRuby },
    "package.json": { label: "package.json", icon: svgJson },
    "package-lock.json": { label: "package-lock.json", icon: svgFile },
    "yarn.lock": { label: "yarn.lock", icon: svgFile },
    "pnpm-lock.yaml": { label: "pnpm-lock.yaml", icon: svgFile },
    "docker-compose.yml": { label: "Docker Compose (YAML)", icon: svgDocker },
    "docker-compose.yaml": { label: "Docker Compose (YAML)", icon: svgDocker },
  };

  // check special filename first
  if (specialFilenameMap[filename]) {
    const e = specialFilenameMap[filename];
    return wrap(e.icon, e.label);
  }

  // check extension mapping
  if (map[ext]) {
    const e = map[ext];
    return wrap(e.icon, e.label);
  }

  // sometimes name without extension is in the map
  if (map[filename]) {
    const e = map[filename];
    return wrap(e.icon, e.label);
  }

  // fallback: show generic File + raw ext uppercased
  const fallbackLabel = ext && ext !== filename ? ext.toUpperCase() : "File";
  return wrap(svgFile, fallbackLabel);
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
      // RESET TOTAL saat kosong
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
  // grid layout switches when expanded to ensure '+' fixed left and textarea moves above
  const gridStyle = expanded
    ? {
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gridTemplateRows: "auto auto",
        alignItems: "center",
        gap: 8,
      }
    : {
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        alignItems: "center",
        gap: 8,
      };

  // onInput handler added directly to textarea to reliably trigger resize + expanded update
  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    if (!ta) return;

    // RESET when empty
    if (ta.value.trim().length === 0) {
      ta.style.height = "40px";
      setExpanded(false);
      return;
    }

    // auto resize
    ta.style.height = "40px";
    ta.style.height = ta.scrollHeight + "px";

    // set expanded when scrollHeight > single-line height (40)
    setExpanded(ta.scrollHeight > 40);
  };

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

        {/* INPUT ROW: menggunakan CSS Grid agar + selalu di kiri dan textarea bisa pindah ke atas */}
        <div
          style={gridStyle}
          className="transition-all duration-300 ease-in-out px-3 py-2"
        >
          {/* LEFT: tombol + (selalu di kolom 1); posisinya di row 1 saat inline, row 2 saat expanded */}
          <div
            style={
              expanded
                ? { gridColumn: "1 / 2", gridRow: 2, justifySelf: "start" }
                : { gridColumn: "1 / 2", gridRow: 1, justifySelf: "start" }
            }
          >
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
          </div>

          {/* TEXTAREA: when expanded -> span whole first row (gridColumn 1 / -1), otherwise placed in middle column */}
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Type a message..."
            onInput={handleTextareaInput}
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
              transition-[height,transform,opacity] duration-300 ease-in-out
              pr-12
            `}
            style={
              expanded
                ? {
                    gridColumn: "1 / -1",
                    gridRow: 1,
                    height: textareaRef.current ? textareaRef.current.style.height || "40px" : "40px",
                  }
                : { gridColumn: "2 / 3", gridRow: 1, height: "40px" }
            }
          />

          {/* RIGHT GROUP: mic + send */}
          <div
            style={
              expanded
                ? { gridColumn: "3 / 4", gridRow: 2, justifySelf: "end", display: "flex", gap: 8 }
                : { gridColumn: "3 / 4", gridRow: 1, display: "flex", gap: 8 }
            }
          >
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
    </div>
  );
}
