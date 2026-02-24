// chat/ChatClient.tsx
"use client";

// supabase
import { supabase } from "@/app/lib/supabase";
// react components
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useEffect, useRef, useState } from "react";

// framer-motion
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Check,
  Copy,
  WrapText,
  Share2,
  MoreVertical,
  Sparkles,
  Pin,
  Archive,
  Flag,
  Trash2,
  Edit2,
  Search as SearchIcon,
  Image as ImageIcon,
  // icons for modal
  X,
  FileText,
  ZoomIn,
  ZoomOut,
  RefreshCw,
} from "lucide-react";

// components
import ChatSidebar from "@/components/ChatSidebar";
import AuthButtons from "@/components/AuthButtons";
import LoginSuccessToast from "@/components/LoginSuccessToast";
import ChatInput from "@/app/chat/components/ChatInput";
import TextAnimation from "@/app/chat/components/TextAnimation";
import { useToast } from "@/components/GlobalToast";
import ReportSuccessToast from "@/components/ReportSuccessToast";

// icons from react
import {
  FaWhatsapp,
  FaTelegramPlane,
  FaInstagram,
  FaTiktok,
  FaFacebook,
  FaLink,
} from "react-icons/fa";

// language color pallete
const LANGUAGE_COLORS: Record<string, string> = {
  html: "from-orange-500/30 to-red-500/10",
  js: "from-yellow-500/30 to-amber-500/10",
  ts: "from-blue-500/30 to-cyan-500/10",
  css: "from-sky-500/30 to-blue-500/10",
  json: "from-green-500/30 to-emerald-500/10",
};

// small helper: dev-only logger
const isProd = process.env.NODE_ENV === "production";
const devLog = (...args: any[]) => {
  if (!isProd) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
};

// type message
type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

// type overlay
type OverlayType =
  | null
  | "search"
  | "images"
  | "settings"
  | "profile";

export default function ChatClient() {
  // states
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [overlay, setOverlay] = useState<OverlayType>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);
  const currentSessionRef = useRef<string | null>(null);
  const [sendingUser, setSendingUser] = useState(false);
  const [waitingAI, setWaitingAI] = useState(false);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [shareText, setShareText] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editTargetId, setEditTargetId] = useState<number | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reportSending, setReportSending] = useState(false);
  const toast = useToast();

  // new: modal state for deleting current session
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // --- tambahan untuk search/images overlay ---
  const [recentList, setRecentList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  const [imagesList, setImagesList] = useState<{ name: string; url: string }[]>(
    []
  );
  const [imagesLoading, setImagesLoading] = useState(false);
  const [headerPinned, setHeaderPinned] = useState<boolean | null>(null);
  const [headerArchived, setHeaderArchived] = useState<boolean | null>(null);

  // --- NEW: dropdown + sorting for Search overlay Recent ---
  const [searchRecentOpen, setSearchRecentOpen] = useState(false);
  const [searchSort, setSearchSort] = useState<
    "newest" | "oldest" | "pinned_first" | "unpinned_first"
  >("newest");

  // new helper: refresh recentList (dipakai oleh search overlay)
  const fetchRecentForSearch = async () => {
    if (!user) return;
    setSearchLoading(true);
    try {
      const { data } = await supabase
        .from("chat_sessions")
        .select("id, title, created_at, pinned, archived")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setRecentList(data);
    } catch (e) {
      console.error("fetchRecentForSearch error", e);
    } finally {
      setSearchLoading(false);
    }
  };

  // fetch images from bucket 'voitzu_storage' by prefix user.email
  const fetchImagesForUser = async () => {
    if (!user || !user.email) return;
    setImagesLoading(true);

    try {
      const prefix = `${user.email}/`; // folder per-user

      const { data, error } = await supabase.storage
        .from("voitzu_storage")
        .list(prefix, { limit: 200, offset: 0 });

      if (error) {
        console.error("Supabase storage list error", error);
        setImagesList([]);
        return;
      }

      if (!data || data.length === 0) {
        setImagesList([]);
        return;
      }

      // ambil hanya file image
      const imageFiles = data.filter(
        (f) =>
          f.metadata?.mimetype?.startsWith("image") ||
          /\.(png|jpe?g|webp|gif)$/i.test(f.name)
      );

      // generate signed url (karena bucket private)
      const signedImages = await Promise.all(
        imageFiles.map(async (f) => {
          const path = `${prefix}${f.name}`;

          const { data: signedData, error: signedError } =
            await supabase.storage
              .from("voitzu_storage")
              .createSignedUrl(path, 60 * 5); // 5 menit

          if (signedError || !signedData?.signedUrl) {
            console.error("Signed URL error:", signedError);
            return null;
          }

          return {
            name: f.name,
            url: signedData.signedUrl,
          };
        })
      );

      setImagesList(signedImages.filter(Boolean) as { name: string; url: string }[]);
    } catch (e) {
      console.error("fetchImagesForUser error", e);
      setImagesList([]);
    } finally {
      setImagesLoading(false);
    }
  };

  /* ================= AUTH ================= */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  /* ================= CREATE SESSION ================= */
  const createSession = async (text: string) => {
    if (!user) return null;

    if (sessionId) {
      try {
        const { data: existing, error: checkError } = await supabase
          .from("chat_sessions")
          .select("id")
          .eq("id", sessionId)
          .eq("user_id", user.id)
          .single();

        if (!checkError && existing) {
          return sessionId;
        } else {
          console.warn("Existing session id not found in DB, creating new session.");
          setSessionId(null);
          localStorage.removeItem("last_chat_session");
        }
      } catch (e) {
        console.error("Error checking existing session:", e);
        setSessionId(null);
        localStorage.removeItem("last_chat_session");
      }
    }

    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: user.id,
        title: text.slice(0, 30),
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Create Session Error:", JSON.stringify(error ?? "no-data"));
      throw error ?? new Error("Failed to create chat session");
    }

    const id = data.id;
    setSessionId(id);
    localStorage.setItem("last_chat_session", id);
    setSidebarRefreshKey((k) => k + 1);

    return id;
  };

  /* ================= NEW CHAT ================= */
  const handleNewChat = () => {
    setMessages([]);
    setSessionId(null);
    localStorage.removeItem("last_chat_session");
    localStorage.removeItem("has_interacted_chat");
    setHasInteracted(false);
    // juga tutup overlay jika terbuka
    setOverlay(null);
    setSidebarRefreshKey((k) => k + 1);
  };

  /* ================= SCROLL ================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;

    const onScroll = () => {
      const atBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      setShowScrollDown(!atBottom);
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  /* ================= GEMINI CALL ================= */
  const sendToAI = async (allMessages: Message[]) => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: allMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    const data = await res.json();
    return data.text as string;
  };

  /* ================= SEND MESSAGE ================= */
  const handleSend = async (text: string) => {
    if (!user) return;

    setHasInteracted(true);
    localStorage.setItem("has_interacted_chat", "true");

    setSendingUser(true);

    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setSendingUser(false);

    const allMessages = [...(messages || []), userMsg];

    let sid: string | null = null;
    try {
      sid = await createSession(text);
    } catch (err) {
      console.error("Failed to create session:", JSON.stringify(err));
      return;
    }
    if (!sid) {
      console.error("No session id returned from createSession.");
      return;
    }

    const { data: userInsData, error: userInsertError } = await supabase
      .from("messages")
      .insert({
        chat_session_id: sid,
        role: "user",
        content: text,
      })
      .select();

    if (userInsertError) {
      console.error("Insert user message error:", JSON.stringify(userInsertError));
    } else {
      devLog("User message inserted:", userInsData);
    }

    setWaitingAI(true);

    const aiText = await sendToAI(allMessages);

    setWaitingAI(false);

    const aiMsg: Message = {
      id: Date.now() + 1,
      role: "assistant",
      content: aiText,
    };

    setMessages((prev) => [...prev, aiMsg]);

    const { data: aiInsData, error: aiInsertError } = await supabase
      .from("messages")
      .insert({
        chat_session_id: sid,
        role: "assistant",
        content: aiText,
      })
      .select();

    if (aiInsertError) {
      console.error("Insert assistant message error:", JSON.stringify(aiInsertError));
    } else {
      devLog("Assistant message inserted:", aiInsData);
    }
    devLog("DEBUG: sid:", sid, "user.id:", user.id);
  };

  /* ================= LOAD MESSAGES ================= */
  useEffect(() => {
    if (!sessionId) return;

    currentSessionRef.current = sessionId;
    setLoadingMessages(true);

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("role, content, created_at")
        .eq("chat_session_id", sessionId)
        .order("created_at", { ascending: true });

      if (currentSessionRef.current !== sessionId) return;

      if (!error && data) {
        setMessages(
          data.map((m) => ({
            id: new Date(m.created_at).getTime(),
            role: m.role,
            content: m.content,
          }))
        );
      }

      setLoadingMessages(false);
    };

    loadMessages();
  }, [sessionId]);

  /* ================= RESTORE LAST CHAT ================= */
  useEffect(() => {
    const restore = async () => {
      try {
        const hasInteracted = localStorage.getItem("has_interacted_chat") === "true";
        if (!hasInteracted) return;

        const last = localStorage.getItem("last_chat_session");
        if (!last) return;

        const { data: authData } = await supabase.auth.getSession();
        const userId = authData?.session?.user?.id ?? null;

        if (!userId) {
          console.warn("No authenticated user when restoring last session. Clearing local last_chat_session.");
          localStorage.removeItem("last_chat_session");
          return;
        }

        const { data, error } = await supabase
          .from("chat_sessions")
          .select("id")
          .eq("id", last)
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          console.error("Error checking last chat session:", error);
          localStorage.removeItem("last_chat_session");
          setSessionId(null);
          return;
        }

        if (data) {
          devLog("Restored last chat session:", data.id);
          setSessionId(data.id);
        } else {
          devLog("Last chat session not found or not owned by user. Clearing local value.");
          localStorage.removeItem("last_chat_session");
          setSessionId(null);
        }
      } catch (e) {
        console.error("Unexpected error while restoring last session:", e);
        localStorage.removeItem("last_chat_session");
        setSessionId(null);
      }
    };

    restore();
  }, []);

  // ================= EDIT MESSAGE =================
  const handleEdit = (id: number, content: string) => {
    setEditTargetId(id);
    setEditText(content);
  };

  // ================= SUBMIT EDIT =================
  const submitEdit = async () => {
    if (!editTargetId || !editText.trim()) return;

    setEditTargetId(null);

    setMessages((prev) => {
      const index = prev.findIndex((m) => m.id === editTargetId);
      return prev.slice(0, index);
    });

    await handleSend(editText);
  };

  // ================= COPY MESSAGE =================
  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast("Copied to clipboard");
  };

  // ================= SHARE MESSAGE =================
  const handleShare = (text: string) => {
    setShareText(text);
  };

  const openSharePanelWith = (text: string) => {
    setShareText(text);
  };

  const submitReport = async () => {
    if (!user) { toast("Silakan login untuk melapor"); return; }
    setReportSending(true);
    try {
      const payload: any = {
        user_id: user.id,
        title: reportTitle || null,
        description: reportDesc || null,
      };
      if (sessionId) payload.chat_session_id = sessionId;

      // gunakan .select() supaya Supabase mengembalikan data yang disisipkan
      const { data, error } = await supabase.from("report").insert(payload).select();

      console.log("submitReport response:", { data, error });

      if (error) {
        console.error("Failed to insert report", error);
        toast("Gagal mengirim laporan");
      } else {
        // dispatch event supaya ReportSuccessToast merespon
        try {
          if (typeof window !== "undefined") {
            // optional: kirim data dalam detail jika butuh
            window.dispatchEvent(new CustomEvent("report_success", { detail: { data } }));
          }
        } catch (e) {
          console.warn("dispatch event failed", e);
        }

        toast("Laporan terkirim");
        setReportModalOpen(false);
        setReportTitle("");
        setReportDesc("");
        console.log("Report inserted:", data);
      }
    } catch (e) {
      console.error("submitReport unexpected error", e);
      toast("Gagal mengirim laporan");
    } finally {
      setReportSending(false);
    }
  };

  // ================= DELETE (modal flow) =================
  const openDeleteModal = () => setDeleteModalOpen(true);
  const closeDeleteModal = () => setDeleteModalOpen(false);

  const confirmDeleteCurrentSession = async () => {
    if (!sessionId || !user) {
      toast("Tidak ada session aktif untuk dihapus.");
      closeDeleteModal();
      setMoreOpen(false);
      return;
    }

    setDeleting(true);

    try {
      await supabase.from("messages").delete().eq("chat_session_id", sessionId);
      const { error } = await supabase.from("chat_sessions").delete().eq("id", sessionId);
      if (error) {
        console.error("Delete session error", error);
        toast("Gagal menghapus obrolan");
      } else {
        setMessages([]);
        setSessionId(null);
        localStorage.removeItem("last_chat_session");
        setSidebarRefreshKey((k) => k + 1);
        toast("Obrolan dihapus");
      }
    } catch (e) {
      console.error("Error deleting session:", e);
      toast("Gagal menghapus obrolan");
    } finally {
      setDeleting(false);
      closeDeleteModal();
      setMoreOpen(false);
    }
  };

  // ================= MORE MENU (fetch current pinned/archived state when open) =================
  useEffect(() => {
    if (!moreOpen || !sessionId) {
      setHeaderPinned(null);
      setHeaderArchived(null);
      return;
    }
    // ambil status sekarang agar label dinamis
    (async () => {
      try {
        const { data } = await supabase.from("chat_sessions").select("pinned, archived").eq("id", sessionId).maybeSingle();
        setHeaderPinned(!!data?.pinned);
        setHeaderArchived(!!data?.archived);
      } catch (e) {
        console.error("fetch header session state", e);
      }
    })();
  }, [moreOpen, sessionId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };

    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  // ================= helper: sorted recent (for search overlay) =================
  const sortedRecentForSearch = () => {
    const arr = (recentList || []).slice();
    switch (searchSort) {
      case "newest":
        return arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "oldest":
        return arr.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case "pinned_first":
        return arr.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      case "unpinned_first":
        return arr.sort((a, b) => {
          if (a.pinned && !b.pinned) return 1;
          if (!a.pinned && b.pinned) return -1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      default:
        return arr;
    }
  };

  /* ---------------- MODAL (moved here) ---------------- */
  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"image" | "file" | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | undefined>(undefined);
  const [modalFile, setModalFile] = useState<File | null>(null);
  const [modalFileText, setModalFileText] = useState<string>("");
  const [modalFileLoading, setModalFileLoading] = useState(false);

  // zoom for image preview
  const [zoom, setZoom] = useState<number>(1);
  const zoomStep = 0.25;
  const zoomMin = 0.25;
  const zoomMax = 5;

  // ref for update callback that ChatInput will send when opening file (so we can update attachment in ChatInput)
  const updateAttachmentCallbackRef = useRef<((f: File) => void) | null>(null);

  // open handlers called by ChatInput
  const openImageModal = (preview: string) => {
    setModalType("image");
    setModalImageUrl(preview);
    setModalOpen(true);
    setZoom(1);
  };

  const openFileModalFromChild = async (file: File, _index: number, updateCallback?: (f: File) => void) => {
    setModalType("file");
    setModalFile(file);
    setModalOpen(true);
    if (updateCallback) updateAttachmentCallbackRef.current = updateCallback;
    setModalFileLoading(true);
    try {
      const text = await file.text();
      setModalFileText(text);
    } catch (err) {
      setModalFileText("// Unable to read file content.");
    } finally {
      setModalFileLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
    setModalImageUrl(undefined);
    setModalFile(null);
    setModalFileText("");
    setModalFileLoading(false);
    setZoom(1);
    updateAttachmentCallbackRef.current = null;
  };

  const zoomIn = () => setZoom((z) => Math.min(zoomMax, +(z + zoomStep).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(zoomMin, +(z - zoomStep).toFixed(2)));
  const zoomReset = () => setZoom(1);

  const saveFileEditsFromModal = () => {
    if (!modalFile) return;
    const newBlob = new Blob([modalFileText], { type: modalFile.type || "text/plain" });
    const newFile = new File([newBlob], modalFile.name, { type: newBlob.type });
    // call update callback in ChatInput to replace attachment
    if (updateAttachmentCallbackRef.current) {
      updateAttachmentCallbackRef.current(newFile);
    }
    closeModal();
  };

  /* ================= UI ================= */
  return (
    // make layout stack on small screens and side-by-side on md+
    <main className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      {user && (
        <ChatSidebar
          key={sidebarRefreshKey}
          user={user}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          onSelectChat={(id) => {
            if (id === sessionId) return;
            setMessages([]);
            setSessionId(id);
            setOverlay(null);
          }}
          onNewChat={handleNewChat}
          onOpenSearch={() => {
            setOverlay("search");
            fetchRecentForSearch();
          }}
          onOpenImages={() => {
            setOverlay("images");
            fetchImagesForUser();
          }}
          onOpenSettings={() => setOverlay("settings")}
          onOpenProfile={() => setOverlay("profile")}
          onShareSession={openSharePanelWith}
        />
      )}

      {user && <LoginSuccessToast />}
      {user && <ReportSuccessToast />}

      <div className="flex-1 flex flex-col relative">
        {/* HEADER */}
        <header className="sticky top-0 z-10 bg-black border-b border-white/5 px-4 md:px-6 py-2 flex justify-between items-center">
          {/* LEFT */}
          <div className="flex items-center gap-3">
            {user && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden text-gray-400 hover:text-white"
                aria-label="Open sidebar"
              >
                ☰
              </button>
            )}

            <div>
              <h1 className="text-lg font-semibold leading-none">
                Voi
                <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
                  Tzu
                </span>
              </h1>
              <p className="text-[10px] tracking-widest text-gray-500 uppercase">
                Arcane Void Intelligence
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-2">
            {/* Upgrade (desktop only) */}
            {user && (
              <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
        bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition">
                <Sparkles size={14} />
                Upgrade Pro
              </button>
            )}

            {/* Share */}
            {user && (
              <button
                onClick={() => {
                  if (!sessionId) { toast("Tidak ada session untuk dibagikan"); return; }
                  openSharePanelWith(`${location.origin}/chat/${sessionId}`);
                }}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
                title="Share"
              >
                <Share2 size={18} />
              </button>
            )}

            {/* MORE */}
            {user && (
              <div ref={moreRef} className="relative">
                <button
                  onClick={() => setMoreOpen((v) => !v)}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
                  title="More"
                >
                  <MoreVertical size={18} />
                </button>

                <AnimatePresence>
                  {moreOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 rounded-xl bg-[#111] border border-white/10 shadow-xl overflow-hidden z-50"
                    >
                      <DropdownItem
                        icon={<Pin size={14} />}
                        label={headerPinned ? "Unpin chat" : "Pin chat"}
                        onClick={async () => {
                          if (!sessionId) { toast("Tidak ada session"); setMoreOpen(false); return; }
                          try {
                            const { data: sessionData } = await supabase.from("chat_sessions").select("pinned").eq("id", sessionId).maybeSingle();
                            const currentPinned = sessionData?.pinned ?? false;
                            await supabase.from("chat_sessions").update({ pinned: !currentPinned }).eq("id", sessionId);
                            toast(!currentPinned ? "Chat disematkan" : "Penyematan dibatalkan");
                            setSidebarRefreshKey((k) => k + 1);
                          } catch (e) {
                            console.error("toggle pin error", e);
                            toast("Gagal memperbarui penyematan");
                          } finally {
                            setMoreOpen(false);
                          }
                        }}
                      />

                      <DropdownItem
                        icon={<Archive size={14} />}
                        label={headerArchived ? "Restore from archive" : "Archive"}
                        onClick={async () => {
                          if (!sessionId) { toast("Tidak ada session"); setMoreOpen(false); return; }
                          try {
                            const { data: sessionData } = await supabase.from("chat_sessions").select("archived").eq("id", sessionId).maybeSingle();
                            const currentArchived = sessionData?.archived ?? false;
                            await supabase.from("chat_sessions").update({ archived: !currentArchived }).eq("id", sessionId);
                            toast(!currentArchived ? "Chat diarsipkan" : "Pemulihan arsip berhasil");
                            setSidebarRefreshKey((k) => k + 1);
                          } catch (e) {
                            console.error("toggle archive error", e);
                            toast("Gagal memperbarui arsip");
                          } finally {
                            setMoreOpen(false);
                          }
                        }}
                      />

                      <DropdownItem
                        icon={<Flag size={14} />}
                        label="Report chat"
                        onClick={() => { setReportModalOpen(true); setMoreOpen(false); }}
                      />

                      <div className="h-px bg-white/10 my-1" />

                      <DropdownItem
                        icon={<Trash2 size={14} />}
                        label="Delete chat"
                        danger
                        onClick={() => {
                          // open modal instead of confirm
                          openDeleteModal();
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Auth (guest only) */}
            {!user && <AuthButtons />}
          </div>
        </header>

        {/* CHAT */}
        <div className="flex-1 flex flex-col pt-5 min-h-0">{/* min-h-0 to make flex child scroll correctly */}
          <section ref={chatRef} className="flex-1 overflow-y-auto px-0 md:px-0">
            {loadingMessages && (
              <p className="text-center text-gray-500 text-sm mt-10">
                Loading chat...
              </p>
            )}

            {!loadingMessages && messages.length === 0 && <TextAnimation />}

            <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-8 space-y-6">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                >

                  <div
                    className={`px-4 py-3 rounded-2xl text-sm max-w-[100%] md:max-w-[95%] min-w-0
  prose prose-invert prose-sm space-y-4 break-words whitespace-pre-wrap
  ${m.role === "user"
                        ? "bg-[#2f2f2f] rounded-br-sm"
                        : "bg-[#1f1f1f] rounded-bl-sm"
                      }`}
                  >
                    {/* MESSAGE CONTENT */}
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code: CodeBlock,

                        hr: () => (
                          <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                        ),

                        table: ({ children }) => (
                          <div className="overflow-x-auto my-3">
                            <table className="w-full border border-white/10 rounded-lg text-sm">
                              {children}
                            </table>
                          </div>
                        ),

                        thead: ({ children }) => (
                          <thead className="bg-white/5">{children}</thead>
                        ),

                        th: ({ children }) => (
                          <th className="px-3 py-2 text-left border-b border-white/10 font-semibold">
                            {children}
                          </th>
                        ),

                        td: ({ children }) => (
                          <td className="px-3 py-2 border-b border-white/5 align-top">
                            {children}
                          </td>
                        ),

                        tr: ({ children }) => (
                          <tr className="hover:bg-white/5 transition">{children}</tr>
                        ),
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                    {/* ACTION BUTTONS — SELALU MUNCUL */}
                    <div className="mt-3 flex gap-4 text-xs text-gray-400">
                      {/* COPY */}
                      <button
                        onClick={() => handleCopy(m.content)}
                        className="flex items-center gap-1 hover:text-white transition"
                      >
                        <Copy size={14} />
                        Copy
                      </button>

                      {/* USER ONLY: EDIT */}
                      {m.role === "user" && (
                        <button
                          onClick={() => handleEdit(m.id, m.content)}
                          className="flex items-center gap-1 hover:text-yellow-400 transition"
                        >
                          ✏️ Edit
                        </button>
                      )}

                      {/* AI ONLY: SHARE */}
                      {m.role === "assistant" && (
                        <button
                          onClick={() => handleShare(m.content)}
                          className="flex items-center gap-1 hover:text-blue-400 transition"
                        >
                          🔗 Share
                        </button>
                      )}
                    </div>
                  </div>



                </div>
              ))}

              {/* USER LOADING */}
              {sendingUser && (
                <div className="flex justify-end">
                  <div className="bg-[#2f2f2f] rounded-2xl rounded-br-sm">
                    <LoadingBubble />
                  </div>
                </div>
              )}

              {/* AI LOADING */}
              {waitingAI && (
                <div className="flex gap-2 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                    <img src="/favicon.ico" alt="" className="w-6 h-6" />
                  </div>
                  <div className="bg-[#1f1f1f] rounded-2xl rounded-bl-sm">
                    <LoadingBubble />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </section>

          <footer className="sticky bottom-0 bg-gradient-to-t from-[#000] via-[#000]/90 to-[#1f1f1f]/0">
            <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
              {/* Pass modal callbacks to ChatInput so child can ask parent to open modal */}
              <ChatInput onSend={handleSend} onOpenImage={openImageModal} onOpenFile={openFileModalFromChild} />
              <p className="text-[10px] text-gray-500 text-center mb-2">
                VoiTzu may generate inaccurate information.
              </p>
            </div>
          </footer>
        </div>
      </div>

      {/* popup share */}
      <AnimatePresence>
        {shareText && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShareText(null)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-[90%] max-w-sm bg-[#111] rounded-2xl p-5 space-y-4"
            >
              <h3 className="text-sm font-semibold">
                Share to
              </h3>

              <div className="grid grid-cols-4 gap-4 text-center">
                <ShareIcon
                  label="WhatsApp"
                  icon={<FaWhatsapp />}
                  color="bg-green-500"
                  onClick={() =>
                    window.open(
                      `https://wa.me/?text=${encodeURIComponent(shareText)}`,
                      "_blank"
                    )
                  }
                />

                <ShareIcon
                  label="Telegram"
                  icon={<FaTelegramPlane />}
                  color="bg-sky-500"
                  onClick={() =>
                    window.open(
                      `https://t.me/share/url?text=${encodeURIComponent(shareText)}`,
                      "_blank"
                    )
                  }
                />

                <ShareIcon
                  label="Facebook"
                  icon={<FaFacebook />}
                  color="bg-blue-600"
                  onClick={() =>
                    window.open(
                      `https://www.facebook.com/sharer/sharer.php?u=&quote=${encodeURIComponent(
                        shareText
                      )}`,
                      "_blank"
                    )
                  }
                />

                <ShareIcon
                  label="Instagram"
                  icon={<FaInstagram />}
                  color="bg-gradient-to-tr from-pink-500 via-purple-500 to-yellow-500"
                  onClick={async () => {
                    await navigator.clipboard.writeText(shareText);
                    toast("Copied — paste to Instagram");
                  }}
                />

                <ShareIcon
                  label="TikTok"
                  icon={<FaTiktok />}
                  color="bg-black"
                  onClick={async () => {
                    await navigator.clipboard.writeText(shareText);
                    toast("Copied — paste to TikTok");
                  }}
                />

                <ShareIcon
                  label="Copy"
                  icon={<FaLink />}
                  color="bg-zinc-700"
                  onClick={async () => {
                    await navigator.clipboard.writeText(shareText);
                    toast("Copied to clipboard");
                  }}
                />
              </div>

              <button
                onClick={() => setShareText(null)}
                className="w-full mt-2 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEARCH OVERLAY */}
      <AnimatePresence>
        {overlay === "search" && (
          <motion.div
            className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOverlay(null)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="w-[95%] max-w-2xl bg-[#111] rounded-2xl p-5"
            >
              <div className="flex items-center gap-3">
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chat..."
                  className="
                  flex-1 bg-black/40 rounded-lg p-3 text-sm outline-none"
                />
                <button
                  onClick={handleNewChat}
                  className="px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-sm"
                >
                  + New Chat
                </button>
              </div>

              <div className="mt-4">
                {/* REPLACED: Recent with dropdown button */}
                <div className="flex items-center justify-between">
                  <div
                    className="relative"
                    onMouseEnter={() => {
                      if (typeof window !== "undefined" && window.innerWidth >= 768) {
                        setSearchRecentOpen(true);
                      }
                    }}
                    onMouseLeave={() => {
                      if (typeof window !== "undefined" && window.innerWidth >= 768) {
                        setSearchRecentOpen(false);
                      }
                    }}
                  >
                    <button
                      onClick={() => {
                        // toggle (for mobile)
                        setSearchRecentOpen((v) => !v);
                      }}
                      className="flex items-center gap-2 text-sm text-gray-300 px-2 py-1 rounded-md hover:bg-white/5"
                    >
                      <span className="text-sm text-gray-400">Recent</span>
                      <ChevronDown size={14} />
                    </button>

                    <AnimatePresence>
                      {searchRecentOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.98 }}
                          transition={{ duration: 0.12 }}
                          className="absolute left-0 mt-2 w-44 bg-[#0c0c0c] border border-white/10 rounded-lg shadow-lg z-50 overflow-hidden"
                        >
                          <button
                            onClick={() => { setSearchSort("newest"); setSearchRecentOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-sm ${searchSort === "newest" ? "bg-white/5" : "hover:bg-white/5"}`}
                          >
                            Newest
                          </button>
                          <button
                            onClick={() => { setSearchSort("oldest"); setSearchRecentOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-sm ${searchSort === "oldest" ? "bg-white/5" : "hover:bg-white/5"}`}
                          >
                            Oldest
                          </button>
                          <button
                            onClick={() => { setSearchSort("pinned_first"); setSearchRecentOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-sm ${searchSort === "pinned_first" ? "bg-white/5" : "hover:bg-white/5"}`}
                          >
                            Pinned first
                          </button>
                          <button
                            onClick={() => { setSearchSort("unpinned_first"); setSearchRecentOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-sm ${searchSort === "unpinned_first" ? "bg-white/5" : "hover:bg-white/5"}`}
                          >
                            Unpinned first
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="text-sm text-gray-400">{/* placeholder for alignment */}</div>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 mt-3">
                  {searchLoading && <div className="text-sm text-gray-400">Loading...</div>}
                  {!searchLoading && sortedRecentForSearch()
                    .filter((r) => {
                      if (!searchQuery) return true;
                      return (r.title || "New Chat").toLowerCase().includes(searchQuery.toLowerCase());
                    })
                    .map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setMessages([]);
                          setSessionId(r.id);
                          setOverlay(null);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center justify-between ${r.pinned ? "" : ""}`}
                      >
                        <div className="flex items-center gap-2">
                          {r.pinned ? <Pin size={14} className="text-purple-400" /> : null}
                          <span className="truncate" style={{ maxWidth: 220 }}>{r.title || "New Chat"}</span>
                        </div>
                        <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleString()}</span>
                      </button>
                    ))}
                  {!searchLoading && recentList.length === 0 && (
                    <div className="text-sm text-gray-400">No recent chats.</div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* IMAGES OVERLAY */}
      <AnimatePresence>
        {overlay === "images" && (
          <motion.div
            className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOverlay(null)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="w-[95%] max-w-4xl bg-[#111] rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Images</h3>
                <div className="text-sm text-gray-400">{user?.email}</div>
              </div>

              {imagesLoading && <div className="text-sm text-gray-400">Loading images...</div>}

              {!imagesLoading && imagesList.length === 0 && (
                <div className="text-sm text-gray-400">No images available yet.</div>
              )}

              {!imagesLoading && imagesList.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {imagesList.map((img) => (
                    <div key={img.name} className="rounded-lg overflow-hidden bg-black/20">
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-32 sm:h-36 md:h-40 object-cover"
                        loading="lazy"
                      />
                      <div className="p-2 text-xs truncate text-gray-300" title={img.name}>{img.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* popup edit */}
      <AnimatePresence>
        {editTargetId && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditTargetId(null)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-[90%] max-w-lg bg-[#111] rounded-2xl p-5 space-y-4"
            >
              <h3 className="text-sm font-semibold">Edit message</h3>

              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="Type your message..."
                className="resize-none
                w-full h-32 bg-black/40 rounded-lg p-3 text-sm border-none outline-none"
              />

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditTargetId(null)}
                  className="px-5 py-3 text-sm rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30"
                >
                  Cancel
                </button>
                <button
                  onClick={submitEdit}
                  className="
                  px-5 py-3 text-sm rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 
                  hover:bg-gradient-to-r hover:from-purple-700 hover:to-indigo-700
                  active:bg-gradient-to-r active:from-purple-800 active:to-indigo-800"
                >
                  Send
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* popup report */}
      <AnimatePresence>
        {reportModalOpen && (
          <motion.div className="fixed inset-0 z-70 bg-black/60 flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setReportModalOpen(false)}
          >
            <motion.div onClick={(e) => e.stopPropagation()} initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} transition={{ duration: 0.12 }} className="w-[92%] max-w-md bg-[#111] rounded-2xl p-5">
              <h3 className="text-lg font-semibold">Report</h3>
              <p className="text-sm text-gray-400 mt-2">Please fill in the title and description of the report.</p>

              <input
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Report title"
                className="
              w-full bg-black/40 rounded-lg p-2 mt-3
              border-none outline-none
              " />
              <textarea
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                placeholder="Report description"
                className="
              w-full bg-black/40 rounded-lg p-2 mt-3 h-28 resize-none
              border-none outline-none" />

              <div className="mt-4 flex gap-3 justify-end">
                <button onClick={() => setReportModalOpen(false)} disabled={reportSending} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20
                active:bg-white/30">Cancel</button>
                <button
                  onClick={submitReport}
                  disabled={reportSending}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:bg-gradient-to-r hover:from-purple-700 hover:to-indigo-700 
                  active:bg-gradient-to-r active:from-purple-800 active:to-indigo-800"
                >
                  {reportSending ? "Sending..." : "Send"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRM MODAL (professional) */}
      <AnimatePresence>
        {deleteModalOpen && (
          <motion.div
            className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!deleting) closeDeleteModal();
            }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="w-[90%] max-w-md bg-[#111] rounded-2xl p-5"
            >
              <h3 className="text-lg font-semibold">Delete Chat History</h3>
              <p className="text-sm text-gray-400 mt-2">
                Are you sure you want to delete this chat? This action cannot be undone.
                All messages in the chat will be deleted.

              </p>

              <div className="mt-4 flex gap-3 justify-end">
                <button
                  onClick={closeDeleteModal}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteCurrentSession}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- MODAL moved to ChatClient (image + file) ---------------- */}
      {/* Parent overlay is full-screen (fixed inset-0) with high z-index (z-[200]).
          If you need to change layering, update z-[200] here and z-[210] for controls. */}
      {modalOpen && modalType === "image" && modalImageUrl && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={closeModal}
        >
          {/* close button fixed to top-right of viewport */}
          <button
            onClick={closeModal}
            aria-label="Close preview"
            className="fixed right-4 top-4 z-[210] rounded-full p-2 bg-white/10 hover:bg-white/20"
          >
            <X size={20} />
          </button>

          {/* zoom controls */}
          <div className="fixed right-4 top-16 z-[210] flex gap-2">
            <button onClick={zoomIn} title="Zoom in" className="rounded-full p-2 bg-white/10 hover:bg-white/20">
              <ZoomIn size={16} />
            </button>
            <button onClick={zoomOut} title="Zoom out" className="rounded-full p-2 bg-white/10 hover:bg-white/20">
              <ZoomOut size={16} />
            </button>
            <button onClick={zoomReset} title="Reset zoom" className="rounded-full p-2 bg-white/10 hover:bg-white/20">
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="relative w-full h-full flex items-center justify-center p-6" onClick={(e) => e.stopPropagation()}>
            <div className="inline-block" style={{ maxWidth: "90vw", maxHeight: "90vh", overflow: "auto", borderRadius: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                <img
                  src={modalImageUrl}
                  alt="Preview"
                  style={{
                    maxWidth: "90vw",
                    maxHeight: "80vh",
                    transform: `scale(${zoom})`,
                    transformOrigin: "center center",
                    display: "block",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {modalOpen && modalType === "file" && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={closeModal}
        >
          {/* close button fixed to top-right of viewport */}
          <button
            onClick={closeModal}
            aria-label="Close file viewer"
            className="fixed right-4 top-4 z-[210] rounded-full p-2 bg-white/10 hover:bg-white/20"
          >
            <X size={20} />
          </button>

          <div
            className="relative w-full h-full max-w-4xl bg-[#111] rounded-md p-4 overflow-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ boxSizing: "border-box", maxHeight: "90vh" }}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <FileText size={18} />
                <div className="text-sm text-gray-300">{modalFile ? modalFile.name : "File"}</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (modalFile) {
                      // re-open same file to reload content
                      openFileModalFromChild(modalFile, 0, updateAttachmentCallbackRef.current ?? undefined);
                    }
                  }}
                  className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10"
                >
                  Reload
                </button>
                <button onClick={saveFileEditsFromModal} className="text-xs px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white">
                  Save
                </button>
              </div>
            </div>

            {modalFileLoading ? (
              <div className="text-sm text-gray-400">Loading file...</div>
            ) : (
              <textarea
                value={modalFileText}
                onChange={(e) => setModalFileText(e.target.value)}
                className="w-full h-[70vh] bg-[#0b0b0b] text-sm text-gray-200 p-3 rounded resize-none outline-none"
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}

// ================= SHARE ICON =================
function ShareIcon({
  icon,
  label,
  onClick,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 group"
    >
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl ${color}
        group-hover:scale-110 transition`}
      >
        {icon}
      </div>
      <span className="text-[11px] text-white/70">{label}</span>
    </button>
  );
}

// ================= DROPDOWN ITEM =================
function DropdownItem({
  label,
  onClick,
  danger,
  icon,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2 text-sm transition flex items-center gap-3
        ${danger ? "text-red-400 hover:bg-red-500/10" : "text-gray-300 hover:bg-white/10 hover:text-white"}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ================= LOADING BUBBLE =================
function LoadingBubble() {
  return (
    <div className="flex align-center gap-1 px-4 py-2">
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
    </div>
  );
}


const CodeBlock: Components["code"] = ({ className, children }) => {
  const toast = useToast();
  const match = /language-(\w+)/.exec(className || "");
  const lang = match?.[1] || "code";
  const language = lang.toUpperCase();
  const code = String(children ?? "").replace(/\n$/, "");
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(false);

  if (!match) {
    return (
      <code className="bg-black/40 px-1 py-0.5 rounded text-sm">
        {children}
      </code>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-6 rounded-xl border border-white/10 overflow-hidden group"
    >
      {/* HEADER */}
      <div
        className={`
          sticky top-0
          flex items-center justify-between
          px-3 py-2 text-xs
          bg-gradient-to-r ${LANGUAGE_COLORS[lang] || "from-white/10 to-white/5"
          }
          backdrop-blur
        `}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-300 hover:text-white"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>

          <span className="font-medium tracking-wide">{language}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* WRAP TOGGLE */}
          <motion.button
            onClick={() => setWrap((v) => !v)}
            whileTap={{ scale: 0.9 }}
            className="flex items-center gap-1 text-gray-300 hover:text-white transition"
            title={wrap ? "Disable wrap" : "Enable wrap"}
          >
            <WrapText size={14} />
            <span className="text-xs">{wrap ? "Wrap" : "No-Wrap"}</span>
          </motion.button>

          {/* COPY */}
          <motion.button
            onClick={async () => {
              await navigator.clipboard.writeText(code);
              toast("Code copied to clipboard");

              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            whileTap={{ scale: 0.9 }}
            className="relative flex items-center gap-1 text-gray-300 hover:text-white transition"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.span
                  key="copied"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="flex items-center gap-1 text-green-400"
                >
                  <Check size={14} />
                  Copied
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-1"
                >
                  <Copy size={14} />
                  Copy
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

      </div>

      {/* CODE */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="hover:bg-white/[0.02]"
          >
            <SyntaxHighlighter
              style={oneDark}
              language={lang}
              showLineNumbers
              wrapLongLines={wrap}
              customStyle={{
                margin: 0,
                padding: "14px",
                background: "#0f0f0f",
                fontSize: "13px",
              }}
              lineNumberStyle={{
                color: "#555",
                paddingRight: "12px",
              }}
            >
              {code}
            </SyntaxHighlighter>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
