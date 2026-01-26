// components/ChatSidebar.tsx
"use client";

import { supabase } from "@/app/lib/supabase";
import { useEffect, useRef, useState } from "react";
import {
  Menu,
  X,
  Plus,
  Search,
  Image as ImageIcon,
  MoreHorizontal,
  Share2,
  Edit2,
  Pin,
  Archive,
  Trash2,
  ChevronDown,
  Camera,
  Trash,
  FileImage,
} from "lucide-react";
import Image from "next/image";
import { useToast } from "@/components/GlobalToast";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

type Snapshot = {
  name: string | null;
  username: string | null;
  avatar_storage_path: string | null;
  avatar_public_url: string | null;
  avatar_color: string | null;
};

export default function ChatSidebar({
  user,
  mobileOpen,
  onMobileClose,
  onSelectChat,
  onNewChat,
  onOpenSearch,
  onOpenImages,
  onOpenSettings,
  onOpenProfile,
  onShareSession,
}: {
  user: any;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onOpenSearch: () => void;
  onOpenImages: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onShareSession?: (link: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const toast = useToast();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  // NOTE: avatar handling changed below to support initial fallback with deterministic color
  const initialName = user?.user_metadata?.name || user?.email || "";
  const email = user?.email || "";
  const avatarUrlFromAuth = user?.user_metadata?.avatar_url ?? null;

  // avatar initial (first letter of name or email) uppercase
  const avatarInitial = (initialName?.trim()?.charAt(0) || email?.trim()?.charAt(0) || "?").toUpperCase();

  // deterministic palette (stable per user/email)
  const COLORS = [
    "#EF4444", // red-500
    "#F97316", // orange-500
    "#F59E0B", // amber-500
    "#EAB308", // yellow-500
    "#10B981", // emerald-500
    "#06B6D4", // cyan-500
    "#3B82F6", // blue-500
    "#6366F1", // indigo-500
    "#8B5CF6", // violet-500
    "#EC4899", // pink-500
    "#F43F5E", // rose-500
  ];

  const pickColorFromString = (str: string) => {
    if (!str) return COLORS[0];
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0; // keep 32-bit
    }
    const idx = Math.abs(h) % COLORS.length;
    return COLORS[idx];
  };

  // initial deterministic color
  const defaultAvatarBgColor = pickColorFromString(email || initialName || "");

  // local state for profile/settings UI
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // PROFILE form state
  const [displayName, setDisplayName] = useState<string>(initialName); // used in sidebar display (replaces email)
  const [formName, setFormName] = useState(initialName);
  const [formUsername, setFormUsername] = useState<string>(""); // will load from DB if present
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarUrlFromAuth ?? null); // data URL or signed/public URL for preview
  const [avatarColor, setAvatarColor] = useState<string | null>(defaultAvatarBgColor);
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarStoragePath, setAvatarStoragePath] = useState<string | null>(null); // will hold storage path like 'user@example.com/avatar/...'

  const [recentChat, setRecentChat] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  // NEW: Recent dropdown state & sort
  const [recentDropdownOpen, setRecentDropdownOpen] = useState(false);
  const [recentSort, setRecentSort] = useState<
    "newest" | "oldest" | "pinned_first" | "unpinned_first"
  >("newest");

  // modal state for sidebar delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Avatar edit panel state (the new Edit button toggles this)
  const [showAvatarEditPanel, setShowAvatarEditPanel] = useState(false);

  // color modal for Custom color
  const [showColorModal, setShowColorModal] = useState(false);

  // reset & clear logs modals
  const [showResetModal, setShowResetModal] = useState(false);
  const [showClearLogsModal, setShowClearLogsModal] = useState(false);

  // logs of profile edits (fetched from user_profile_logs if exists)
  const [profileLogs, setProfileLogs] = useState<any[]>([]);

  // snapshots to compare and to restore on cancel/reset
  const [originalSnapshot, setOriginalSnapshot] = useState<Snapshot | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<Snapshot | null>(null);

  // pending deletion flags (Remove marks pending deletion)
  const [pendingDelete, setPendingDelete] = useState(false);
  const [pendingDeletedPath, setPendingDeletedPath] = useState<string | null>(null);

  /* ================= FETCH RECENT & USER DATA ================= */
  useEffect(() => {
    if (!user) return;

    supabase
      .from("chat_sessions")
      .select("id, title, created_at, pinned, archived")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setRecentChat(data);
      });

    // load any existing users table data for username and avatar_color & avatar_url & name
    (async () => {
      try {
        const { data } = await supabase.from("users").select("username, avatar_color, avatar_url, name").eq("id", user.id).maybeSingle();
        if (data) {
          if (data.username) setFormUsername(data.username);
          if (data.avatar_color) setAvatarColor(data.avatar_color);
          if (data.name) {
            setFormName(data.name);
            setDisplayName(data.name);
          }

          // IMPORTANT: avatar_url in DB may be:
          // - a public URL (startsWith http) OR
          // - a storage path like "user@example.com/avatar_....webp"
          // We handle both: if startsWith http -> show directly; else treat as storage path and create signed url.
          let avatar_storage_path: string | null = null;
          let avatar_public_url: string | null = null;

          if (data.avatar_url) {
            const val: string = data.avatar_url;
            if (/^https?:\/\//i.test(val)) {
              // already a URL (maybe previously stored) -> use as preview directly
              setAvatarPreview(val);
              avatar_public_url = val;
              // attempt to extract storage path for future deletes
              const p = getStoragePathFromPublicUrl(val);
              if (p) {
                avatar_storage_path = p;
                setAvatarStoragePath(p);
              }
            } else {
              // treat as storage path (preferred for private bucket). Save path and request signed url later
              avatar_storage_path = val;
              setAvatarStoragePath(val);
            }
          } else {
            // fallback: if user metadata includes avatar_url (maybe auth-provided)
            if (avatarUrlFromAuth) {
              if (/^https?:\/\//i.test(String(avatarUrlFromAuth))) {
                avatar_public_url = String(avatarUrlFromAuth);
                setAvatarPreview(avatar_public_url);
              } else {
                avatar_storage_path = String(avatarUrlFromAuth);
                setAvatarStoragePath(avatar_storage_path);
              }
            }
          }

          const snap: Snapshot = {
            name: data.name ?? null,
            username: data.username ?? null,
            avatar_storage_path: avatar_storage_path ?? null,
            avatar_public_url: avatar_public_url ?? null,
            avatar_color: data.avatar_color ?? null,
          };

          // if originalSnapshot not set, set it. savedSnapshot reflects the "last saved" state.
          setOriginalSnapshot((prev) => prev ?? snap);
          setSavedSnapshot(snap);
        } else {
          // no row in users table -> build fallback snapshot from auth metadata
          const snap: Snapshot = {
            name: user?.user_metadata?.name ?? null,
            username: null,
            avatar_storage_path: null,
            avatar_public_url: avatarUrlFromAuth ?? null,
            avatar_color: defaultAvatarBgColor,
          };
          setOriginalSnapshot((prev) => prev ?? snap);
          setSavedSnapshot(snap);
        }
      } catch (e) {
        // ignore
      }

      // fetch profile logs if table exists
      try {
        const { data: logsData } = await supabase
          .from("user_profile_logs")
          .select("id, changes, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);
        if (logsData) setProfileLogs(logsData);
      } catch (e) {
        // table may not exist — ignore silently
      }
    })();
  }, [user]);

  /* ================= when avatarStoragePath changes -> create signed url ================= */
  useEffect(() => {
    if (!avatarStoragePath || !user) {
      // if path removed, ensure avatarPreview null only if we don't have a public url in savedSnapshot
      if (!avatarStoragePath && savedSnapshot?.avatar_public_url) {
        setAvatarPreview(savedSnapshot.avatar_public_url);
      } else if (!avatarStoragePath && !savedSnapshot?.avatar_public_url) {
        // keep whatever preview currently is (do not blindly erase)
        // do nothing
      }
      return;
    }

    let mounted = true;
    const refresh = async () => {
      try {
        // create signed url (TTL 1 hour)
        const ttl = 60 * 60;
        const { data: signedData, error: signErr } = await supabase.storage
          .from("voitzu_storage")
          .createSignedUrl(avatarStoragePath, ttl);
        if (signErr) {
          console.warn("createSignedUrl error", signErr);
          return;
        }
        if (signedData?.signedUrl && mounted) {
          const signed = `${signedData.signedUrl}${signedData.signedUrl.includes("?") ? "&" : "?"}v=${Date.now()}`;
          setAvatarPreview(signed);
          // console.log("Signed url created ->", signed);
        }
      } catch (e) {
        console.warn("signed-url failed", e);
      }
    };

    // request signed url
    refresh();

    return () => { mounted = false; };
  }, [avatarStoragePath, user, savedSnapshot]);

  /* ================= REALTIME ================= */
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`chat-sessions-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_sessions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          supabase
            .from("chat_sessions")
            .select("id, title, created_at, pinned, archived")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .then(({ data }) => {
              if (data) setRecentChat(data);
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  /* ================= CLOSE USER MENU ================= */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* ================= CLOSE DROPDOWN ON CLICK OUTSIDE ================= */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ================= CLOSE DROPDOWN ON SCROLL/RESIZE ================= */
  useEffect(() => {
    if (!openMenuId) return;
    const onScrollOrResize = () => setOpenMenuId(null);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [openMenuId]);

  /* ================= CLICK GUARD ================= */
  const guard = (action?: () => void) => {
    if (collapsed) {
      setCollapsed(false);
      return;
    }
    action?.();
  };

  /* ============ ACTIONS FOR RECENT ITEM ============ */
  const handleShareSession = async (id: string, title?: string) => {
    try {
      const url = `${location.origin}/chat/${id}`;
      if (onShareSession) {
        onShareSession(url); // buka share panel di ChatClient
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast("Link obrolan disalin ke clipboard");
      } else {
        toast("Salin manual: " + url);
      }
      setOpenMenuId(null);
    } catch {
      toast("Gagal menyalin link");
      setOpenMenuId(null);
    }
  };

  const handleRenameSession = async (id: string, currentTitle?: string) => {
    setEditingId(id);
    setEditingText(currentTitle ?? "");
    setOpenMenuId(null);
  };

  const commitRename = async (id: string) => {
    const trimmed = String(editingText ?? "").slice(0, 120);
    try {
      const { error } = await supabase.from("chat_sessions").update({ title: trimmed }).eq("id", id);
      if (error) toast("Gagal mengganti nama");
      else {
        setRecentChat((prev) => prev.map((r) => (r.id === id ? { ...r, title: trimmed } : r)));
        toast("Nama obrolan diperbarui");
      }
    } catch {
      toast("Gagal mengganti nama");
    } finally {
      setEditingId(null);
      setEditingText("");
    }
  };

  const handleTogglePin = async (id: string, currentPinned?: boolean) => {
    try {
      const { error } = await supabase.from("chat_sessions").update({ pinned: !currentPinned }).eq("id", id);
      if (!error) setRecentChat((prev) => prev.map((r) => (r.id === id ? { ...r, pinned: !currentPinned } : r)));
      toast(!currentPinned ? "Obrolan disematkan" : "Penyematan dibatalkan");
    } catch {
      toast("Gagal memperbarui penyematan");
    } finally { setOpenMenuId(null); }
  };

  const handleToggleArchive = async (id: string, currentArchived?: boolean) => {
    try {
      const { error } = await supabase.from("chat_sessions").update({ archived: !currentArchived }).eq("id", id);
      if (!error) setRecentChat((prev) => prev.map((r) => (r.id === id ? { ...r, archived: !currentArchived } : r)));
      toast(!currentArchived ? "Obrolan diarsipkan" : "Pemulihan arsip berhasil");
    } catch {
      toast("Gagal memperbarui arsip");
    } finally { setOpenMenuId(null); }
  };

  const handleDeleteSession = async (id: string) => {
    const target = recentChat.find((r) => r.id === id);
    setDeleteTarget({ id, title: target?.title });
    setOpenMenuId(null);
    setDeleteModalOpen(true);
  };

  const confirmDeleteSession = async () => {
    if (!deleteTarget) {
      setDeleteModalOpen(false);
      return;
    }
    setDeleting(true);
    try {
      await supabase.from("messages").delete().eq("chat_session_id", deleteTarget.id);
      const { error } = await supabase.from("chat_sessions").delete().eq("id", deleteTarget.id);
      if (error) {
        toast("Gagal menghapus obrolan");
      } else {
        setRecentChat((prev) => prev.filter((r) => r.id !== deleteTarget.id));
        toast("Obrolan dihapus");
      }
    } catch (e) {
      console.error("delete session error", e);
      toast("Gagal menghapus obrolan");
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      setOpenMenuId(null);
    }
  };

  const cancelDeleteSession = () => {
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  // derive display list: apply filtering for archived, then apply user-selected sort
  const deriveDisplayRecent = () => {
    const base = recentChat.slice().filter((r) => (showArchived ? true : !r.archived));

    switch (recentSort) {
      case "newest":
        return base.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "oldest":
        return base.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case "pinned_first":
        return base.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      case "unpinned_first":
        return base.sort((a, b) => {
          if (a.pinned && !b.pinned) return 1;
          if (!a.pinned && b.pinned) return -1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      default:
        return base.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  };

  const displayRecent = deriveDisplayRecent();

  const archivedList = recentChat
    .slice()
    .filter((r) => r.archived)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // === NEW: determine if user has Go plan (you can adjust detection logic)
  const isPro = Boolean(
    user?.user_metadata?.plan === "Pro" ||
    user?.app_metadata?.plan === "Pro" ||
    user?.user_metadata?.is_pro === true
  );

  /* ========== PROFILE HELPERS ========== */

  // utility: convert public url -> storage path (works for supabase public urls)
  const getStoragePathFromPublicUrl = (url?: string | null) => {
    if (!url) return null;
    try {
      // typical supabase public url pattern:
      // https://<proj>.supabase.co/storage/v1/object/public/voitzu_storage/<path>
      const marker = "/object/public/voitzu_storage/";
      const idx = url.indexOf(marker);
      if (idx === -1) return null;
      return decodeURIComponent(url.slice(idx + marker.length));
    } catch {
      return null;
    }
  };

  // compress image in client: return Blob (webp/jpeg), target max ~300kb
  const compressImage = async (file: File, maxSizeKB = 350, maxDim = 1024): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      // gunakan window.Image agar tidak bentrok dengan import dari next/image
      const img = new window.Image();

      const reader = new FileReader();
      reader.onload = (ev) => {
        img.src = ev.target?.result as string;
      };
      reader.onerror = (e) => reject(e);
      img.onload = async () => {
        try {
          let width = img.width;
          let height = img.height;
          const max = Math.max(width, height);
          if (max > maxDim) {
            const ratio = maxDim / max;
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Cannot get canvas context");
          ctx.drawImage(img, 0, 0, width, height);

          // try webp first if supported
          let quality = 0.85;
          const mimeOptions = ["image/webp", "image/jpeg"];
          let blob: Blob | null = null;

          for (const mime of mimeOptions) {
            quality = 0.85;
            for (let iter = 0; iter < 6; iter++) {
              const b: Blob | null = await new Promise((res) => canvas.toBlob(res, mime, quality));
              if (!b) break;
              if (b.size / 1024 <= maxSizeKB || quality <= 0.35) {
                blob = b;
                break;
              }
              quality -= 0.12;
            }
            if (blob) break;
          }

          if (!blob) {
            blob = file;
          }
          resolve(blob);
        } catch (e) {
          reject(e);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // helper: build storage path based on user's email (exact, to match storage policy)
  const buildUserFolderName = () => {
    const rawEmail = (user?.email || "").trim();
    if (!rawEmail) return "unknown";
    return rawEmail; // use exactly the email claim, matching RLS policy expecting folder by email
  };

  // returns whether there are unsaved changes
  const hasChanges = () => {
    const snap = savedSnapshot;
    if (!snap) {
      if (formName !== initialName) return true;
      if ((formUsername || "") !== "") return true;
      if (avatarColor !== defaultAvatarBgColor) return true;
      if (avatarPreview && avatarPreview.startsWith("data:")) return true;
      if (pendingDelete) return true;
      return false;
    }

    if ((formName ?? null) !== (snap.name ?? null)) return true;
    if ((formUsername ?? null) !== (snap.username ?? null)) return true;
    if ((avatarColor ?? null) !== (snap.avatar_color ?? null)) return true;

    if (pendingDelete) return true;
    if (avatarPreview && avatarPreview.startsWith("data:")) return true;

    const currPath = avatarStoragePath ?? null;
    const savedPath = snap.avatar_storage_path ?? null;
    if (currPath !== savedPath) return true;

    return false;
  };

  // handle file selection (album or camera) -> compress & show preview (data URL)
  const handleFileSelected = async (file?: File | null) => {
    if (!file) return;
    try {
      const blob = await compressImage(file, 400, 1280); // try to keep around few ratus KB
      // convert blob to dataURL for preview
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setAvatarPreview(result); // data URL
        // keep a small "pending" storage path marker until saved
        setAvatarStoragePath(null);
        // if previously marked pending delete, cancel that pending delete because user provided a new file
        if (pendingDelete) {
          setPendingDelete(false);
          setPendingDeletedPath(null);
        }
      };
      reader.readAsDataURL(blob as Blob);
      toast("Gambar siap diupload. Tekan Save untuk menyimpan.");
    } catch (e) {
      console.error("compress error", e);
      toast("Gagal memproses gambar");
    }
  };

  const onChooseFromAlbum = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: any) => {
      const f = e.target.files?.[0];
      await handleFileSelected(f);
    };
    input.click();
  };

  const onTakeFromCamera = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    // mobile hint to open camera
    (input as any).capture = "environment";
    input.onchange = async (e: any) => {
      const f = e.target.files?.[0];
      await handleFileSelected(f);
    };
    input.click();
  };

  const onPickColor = (color: string) => {
    setAvatarColor(color);
  };

  // remove: mark pending delete (do NOT immediately delete from storage)
  const onRemoveAvatar = async () => {
    const parsedPath = avatarStoragePath ?? getStoragePathFromPublicUrl(avatarPreview ?? null);
    if (parsedPath) {
      // mark for deletion
      setPendingDelete(true);
      setPendingDeletedPath(parsedPath);
      // hide preview from UI until saved
      setAvatarPreview(null);
      setAvatarStoragePath(null);
      toast("Avatar ditandai untuk dihapus. Tekan Save untuk menerapkan, atau Cancel untuk membatalkan.");
    } else {
      // no saved file existed; simply clear preview and mark pending delete false
      setAvatarPreview(null);
      setAvatarStoragePath(null);
      setPendingDelete(false);
      setPendingDeletedPath(null);
      toast("Avatar akan dihapus setelah Anda menekan Save.");
    }
  };

  // Upsert profile: if avatarPreview is a dataURL, upload to storage first
  const saveProfileToDb = async () => {
    if (!user) { toast("Please login"); return; }
    if (!hasChanges()) { setProfileOpen(false); toast("Tidak ada perubahan"); return; }

    setSavingProfile(true);

    try {
      let storagePathToSave: string | null = null;
      const prevSavedPath = savedSnapshot?.avatar_storage_path ?? null;

      // If avatarPreview looks like a data URL (new image), upload it
      if (avatarPreview && avatarPreview.startsWith("data:")) {
        // convert data URL to blob
        const res = await fetch(avatarPreview);
        const blob = await res.blob();
        // prepare file name
        const ext = blob.type === "image/png" ? "png" : (blob.type === "image/gif" ? "gif" : "webp");
        const safeFolder = buildUserFolderName(); // e.g. "user@example.com"
        const fileName = `VoiTzuAI_${Date.now()}.${ext}`;
        const path = `${safeFolder}/avatar/${fileName}`;

        const { error: uploadError } = await supabase.storage.from("voitzu_storage").upload(path, blob, { upsert: true });
        if (uploadError) {
          console.error("upload avatar error", uploadError);
          toast("Gagal upload avatar");
        } else {
          storagePathToSave = path;
        }
      } else if (avatarPreview && !avatarPreview.startsWith("data:")) {
        // avatarPreview is already a URL → could be signed url or public url
        // attempt to parse storage path from it (if it's a public url)
        const parsed = getStoragePathFromPublicUrl(avatarPreview);
        if (parsed) {
          storagePathToSave = parsed;
        } else if (avatarStoragePath) {
          storagePathToSave = avatarStoragePath;
        } else {
          // cannot locate storage path; leave null
          storagePathToSave = null;
        }
      } else {
        // avatarPreview is null -> means removal or none
        if (pendingDelete) {
          storagePathToSave = null;
        } else {
          // unchanged: keep previous saved path
          storagePathToSave = savedSnapshot?.avatar_storage_path ?? null;
        }
      }

      // Build payload for upsert: store storage path (not the signed/public URL)
      const payload: any = {
        id: user.id,
        email: user.email,
        name: formName || null,
        avatar_url: storagePathToSave || null, // IMPORTANT: store storage path (private-safe)
        avatar_color: avatarColor || null,
        username: formUsername || null,
      };

      const { data, error } = await supabase
        .from("users")
        .upsert(payload, { onConflict: "id" })
        .select()
        .maybeSingle();

      if (error) {
        console.error("upsert users error", error);
        toast("Gagal menyimpan profile");
      } else {
        // update local UI
        toast("Profile tersimpan");
        setProfileOpen(false);
        setDisplayName(formName || user.email);

        // set the storage path state and then let useEffect create signed url for preview
        if (storagePathToSave) {
          setAvatarStoragePath(storagePathToSave);
        } else {
          setAvatarStoragePath(null);
          setAvatarPreview(null);
        }

        // update saved snapshot
        const savedSnap: Snapshot = {
          name: formName || null,
          username: formUsername || null,
          avatar_storage_path: storagePathToSave ?? null,
          avatar_public_url: null,
          avatar_color: avatarColor ?? null,
        };
        setSavedSnapshot(savedSnap);

        // Try to update auth metadata (optional). We avoid setting expiring signed URLs there.
        try {
          if ((supabase.auth as any).updateUser) {
            await (supabase.auth as any).updateUser({ data: { avatar_storage_path: storagePathToSave ?? null, name: formName ?? null } });
          } else if ((supabase.auth as any).update) {
            await (supabase.auth as any).update({ data: { avatar_storage_path: storagePathToSave ?? null, name: formName ?? null } });
          }
        } catch (e) {
          console.warn("update auth user metadata failed (non-fatal)", e);
        }

        // handle deletes:
        try {
          // if pendingDelete was set and we had a previous saved path -> remove it now
          if (pendingDelete && pendingDeletedPath) {
            const { error: delErr } = await supabase.storage.from("voitzu_storage").remove([pendingDeletedPath]);
            if (delErr) console.warn("failed to remove pendingDeletedPath", delErr);
            setPendingDelete(false);
            setPendingDeletedPath(null);
          }

          // if we saved a new avatarPath and previous saved path exists and differs -> remove previous
          if (storagePathToSave && prevSavedPath && prevSavedPath !== storagePathToSave) {
            const pathsToRemove = [prevSavedPath];
            // only remove if it wasn't the one we intentionally marked pending deletion already
            const { error: removeOldErr } = await supabase.storage.from("voitzu_storage").remove(pathsToRemove);
            if (removeOldErr) console.warn("failed to remove previous saved avatar", removeOldErr);
          }
        } catch (e) {
          console.warn("post-save delete error", e);
        }

        // record profile edit log (if table exists)
        try {
          const changes = {
            name: formName || null,
            username: formUsername || null,
            avatar_storage_path: storagePathToSave || null,
            avatar_color: avatarColor || null,
          };
          await supabase.from("user_profile_logs").insert([{ user_id: user.id, changes }]);
          // refresh logs
          const { data: logsData } = await supabase
            .from("user_profile_logs")
            .select("id, changes, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20);
          if (logsData) setProfileLogs(logsData);
        } catch (e) {
          // ignore if table doesn't exist
        }
      }
    } catch (e) {
      console.error(e);
      toast("Gagal menyimpan profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // === FIXED CANCEL: do NOT close panel; only revert fields that changed; preserve avatar if not changed ===
  const handleCancel = () => {
    if (!hasChanges()) {
      toast("Tidak ada perubahan");
      return;
    }

    // revert text fields and color to last saved snapshot (if any)
    if (savedSnapshot) {
      setFormName(savedSnapshot.name ?? initialName);
      setFormUsername(savedSnapshot.username ?? "");
      setAvatarColor(savedSnapshot.avatar_color ?? defaultAvatarBgColor);
    } else {
      // fallback
      setFormName(initialName);
      setFormUsername("");
      setAvatarColor(defaultAvatarBgColor);
    }

    // Avatar revert logic: only touch avatar if user changed avatar (new upload) or marked pending delete.
    const userUploadedNew = Boolean(avatarPreview && avatarPreview.startsWith("data:"));

    if (pendingDelete) {
      // user had requested delete -> restore what's saved (from savedSnapshot)
      if (savedSnapshot?.avatar_public_url) {
        setAvatarPreview(savedSnapshot.avatar_public_url);
        const p = getStoragePathFromPublicUrl(savedSnapshot.avatar_public_url);
        setAvatarStoragePath(p ?? null);
      } else if (savedSnapshot?.avatar_storage_path) {
        setAvatarStoragePath(savedSnapshot.avatar_storage_path);
        setAvatarPreview(null); // let effect fetch signed url
      } else {
        setAvatarPreview(null);
        setAvatarStoragePath(null);
      }
      setPendingDelete(false);
      setPendingDeletedPath(null);
    } else if (userUploadedNew) {
      // user uploaded a new image -> revert to saved
      if (savedSnapshot?.avatar_public_url) {
        setAvatarPreview(savedSnapshot.avatar_public_url);
      } else if (savedSnapshot?.avatar_storage_path) {
        setAvatarStoragePath(savedSnapshot.avatar_storage_path);
        setAvatarPreview(null);
      } else {
        setAvatarPreview(null);
        setAvatarStoragePath(null);
      }
    } else {
      // user did not touch avatar -> keep current avatarPreview / path intact
    }

    // keep the profile panel open per your request
    toast("Perubahan dibatalkan");
    setShowAvatarEditPanel(false);
  };

  // Reset: show confirm modal
  const confirmReset = () => setShowResetModal(true);

  // Actually reset to original snapshot and delete avatar folder contents
  const doResetToOriginal = async () => {
    setShowResetModal(false);
    if (!user) return;
    const snap = originalSnapshot;
    if (!snap) {
      resetProfileForm();
      toast("Di-reset ke pengaturan awal");
      return;
    }

    setSavingProfile(true);
    try {
      const safeFolder = buildUserFolderName();
      const avatarFolderPath = `${safeFolder}/avatar`;
      // list files in avatar folder
      const { data: listData, error: listErr } = await supabase.storage.from("voitzu_storage").list(avatarFolderPath, { limit: 1000 });
      if (listErr) {
        console.warn("list avatar folder error", listErr);
      } else if (listData && listData.length > 0) {
        const pathsToRemove = listData.map((f: any) => `${avatarFolderPath}/${f.name}`);
        const { error: removeErr } = await supabase.storage.from("voitzu_storage").remove(pathsToRemove);
        if (removeErr) console.warn("failed to remove avatar files", removeErr);
        else toast("Semua file di folder avatar telah dihapus");
      }

      const payload: any = {
        id: user.id,
        email: user.email,
        name: snap.name ?? null,
        username: snap.username ?? null,
        avatar_url: snap.avatar_storage_path ?? snap.avatar_public_url ?? null,
        avatar_color: snap.avatar_color ?? null,
      };

      const { error } = await supabase.from("users").upsert(payload, { onConflict: "id" });
      if (error) {
        console.error("reset upsert error", error);
        toast("Gagal mereset profil");
      } else {
        // update UI
        setFormName(snap.name ?? initialName);
        setFormUsername(snap.username ?? "");
        setAvatarColor(snap.avatar_color ?? defaultAvatarBgColor);
        if (snap.avatar_public_url) {
          setAvatarPreview(snap.avatar_public_url);
          const p = getStoragePathFromPublicUrl(snap.avatar_public_url);
          setAvatarStoragePath(p ?? null);
        } else if (snap.avatar_storage_path) {
          setAvatarStoragePath(snap.avatar_storage_path);
          setAvatarPreview(null);
        } else {
          setAvatarPreview(null);
          setAvatarStoragePath(null);
        }
        setSavedSnapshot(snap);
        setDisplayName(snap.name ?? user.email);
        toast("Profil dikembalikan ke setelan awal");

        try {
          await supabase.from("user_profile_logs").insert([{ user_id: user.id, changes: { reset_to: snap } }]);
          const { data: logsData } = await supabase
            .from("user_profile_logs")
            .select("id, changes, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20);
          if (logsData) setProfileLogs(logsData);
        } catch (e) {}
      }
    } catch (e) {
      console.error(e);
      toast("Gagal mereset profil");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleClearLogs = () => setShowClearLogsModal(true);

  const doClearLogs = async () => {
    setShowClearLogsModal(false);
    if (!user) return;
    try {
      const { error } = await supabase.from("user_profile_logs").delete().eq("user_id", user.id);
      if (error) {
        console.error("clear logs error", error);
        toast("Gagal menghapus log");
      } else {
        setProfileLogs([]);
        toast("Log dihapus");
      }
    } catch (e) {
      console.error(e);
      toast("Gagal menghapus log");
    }
  };

  // resetProfileForm: used by Close button and Reset fallback
  const resetProfileForm = () => {
    // prefer savedSnapshot if exists (so Close doesn't accidentally clear avatar)
    if (savedSnapshot) {
      setFormName(savedSnapshot.name ?? initialName);
      setFormUsername(savedSnapshot.username ?? "");
      setAvatarColor(savedSnapshot.avatar_color ?? defaultAvatarBgColor);
      if (savedSnapshot.avatar_public_url) {
        setAvatarPreview(savedSnapshot.avatar_public_url);
        const p = getStoragePathFromPublicUrl(savedSnapshot.avatar_public_url);
        setAvatarStoragePath(p ?? null);
      } else if (savedSnapshot.avatar_storage_path) {
        setAvatarStoragePath(savedSnapshot.avatar_storage_path);
        setAvatarPreview(null); // signed url effect will refresh
      } else {
        setAvatarPreview(null);
        setAvatarStoragePath(null);
      }
    } else {
      // fallback to initial values
      setFormName(initialName);
      setFormUsername("");
      setAvatarPreview(avatarUrlFromAuth ?? null);
      setAvatarColor(defaultAvatarBgColor);
      if (avatarUrlFromAuth) {
        const p = getStoragePathFromPublicUrl(avatarUrlFromAuth);
        if (p) setAvatarStoragePath(p);
      }
    }
    setPendingDelete(false);
    setPendingDeletedPath(null);
  };

  /* ========== RENDER ========== */

  return (
    <>
      {/* OVERLAY MOBILE */}
      {mobileOpen && (
        <div onClick={onMobileClose} className="fixed inset-0 bg-black/60 z-40 md:hidden" />
      )}

      <aside
        onClick={() => collapsed && setCollapsed(false)}
        className={`
          fixed md:sticky top-0 left-0 z-50 h-screen
          bg-black/80 backdrop-blur border-r border-white/5
          flex flex-col transition-all duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          ${collapsed ? "md:w-16" : "w-56 md:w-60"}
        `}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-4">
          <Image src="/favicon.ico" alt="Voitzu" width={26} height={26} />

          {!collapsed && (
            <button onClick={() => setCollapsed(true)} className="hidden md:block text-gray-400">
              <Menu size={18} />
            </button>
          )}

          <button onClick={onMobileClose} className="md:hidden">
            <X size={18} />
          </button>
        </div>

        {/* NEW CHAT */}
        <button
          onClick={() => guard(onNewChat)}
          className={`
            mx-2 mb-3 h-12 rounded-xl
            bg-gradient-to-r from-purple-600 to-indigo-600
            flex items-center
            ${collapsed ? "justify-center px-0" : "gap-2 px-3"}
          `}
        >
          <Plus size={18} />
          {!collapsed && <span>New Chat</span>}
        </button>

        {/* ITEMS */}
        <div className="flex-1 px-2 space-y-1 overflow-y-auto">
          {!collapsed && <div className="text-xs text-gray-400 px-3 mt-2">Tools</div>}

          <Item icon={<Search size={18} />} label="Search" collapsed={collapsed} onClick={() => guard(onOpenSearch)} />
          <Item icon={<ImageIcon size={18} />} label="Images" collapsed={collapsed} onClick={() => guard(onOpenImages)} />

          {!collapsed && (
            <div className="flex items-center justify-between px-3 mt-4">
              {/* Recent dropdown */}
              <div
                className="relative"
                onMouseEnter={() => {
                  if (typeof window !== "undefined" && window.innerWidth >= 768) {
                    setRecentDropdownOpen(true);
                  }
                }}
                onMouseLeave={() => {
                  if (typeof window !== "undefined" && window.innerWidth >= 768) {
                    setRecentDropdownOpen(false);
                  }
                }}
              >
                <button
                  onClick={() => {
                    // toggle for mobile
                    setRecentDropdownOpen((v) => !v);
                  }}
                  className="flex items-center gap-2 text-xs text-gray-400 hover:text-white px-1 py-0.5 rounded"
                >
                  <span>Recent</span>
                  <ChevronDown size={12} />
                </button>

                <AnimatePresence>
                  {recentDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                      className="absolute left-0 mt-2 w-44 bg-[#0b0b0b] border border-white/10 rounded-md shadow-lg z-40 overflow-hidden"
                    >
                      <button
                        onClick={() => { setRecentSort("newest"); setRecentDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-sm ${recentSort === "newest" ? "bg-white/5" : "hover:bg-white/5"}`}
                      >
                        Newest
                      </button>
                      <button
                        onClick={() => { setRecentSort("oldest"); setRecentDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-sm ${recentSort === "oldest" ? "bg-white/5" : "hover:bg-white/5"}`}
                      >
                        Oldest
                      </button>
                      <button
                        onClick={() => { setRecentSort("pinned_first"); setRecentDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-sm ${recentSort === "pinned_first" ? "bg-white/5" : "hover:bg-white/5"}`}
                      >
                        Pinned first
                      </button>
                      <button
                        onClick={() => { setRecentSort("unpinned_first"); setRecentDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-sm ${recentSort === "unpinned_first" ? "bg-white/5" : "hover:bg-white/5"}`}
                      >
                        Unpinned first
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="text-xs">
                <button onClick={() => setShowArchived((s) => !s)} className="text-[11px] text-gray-400 hover:text-white">
                  {showArchived ? "Hide archived" : "Show archived"}
                </button>
              </div>
            </div>
          )}

          {!collapsed &&
            displayRecent.map((c) => (
              <div key={c.id} className="relative flex items-center group">
                {editingId === c.id ? (
                  <input
                    autoFocus
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(c.id);
                      if (e.key === "Escape") { setEditingId(null); setEditingText(""); }
                    }}
                    onBlur={() => commitRename(c.id)}
                    placeholder="Enter a name..."
                    className="
                    w-full h-10 rounded-lg px-2 bg-black/40 text-sm
                    outline-none focus:bg-white/10"
                  />
                ) : (
                  <button
                    onClick={() => onSelectChat(c.id)}
                    className={`w-full h-10 rounded-lg hover:bg-white/5 px-3 text-left truncate flex items-center gap-2 ${c.pinned ? 'bg-gradient-to-r from-purple-700/25 to-indigo-700/5' : ''}`}
                  >
                    {c.pinned && <Pin size={14} className="text-indigo-400" />}
                    <span className="truncate">{c.title || "New Chat"}</span>
                  </button>
                )}

                {/* more button for this recent item */}
                <div className="absolute right-1 top-1/2 -translate-y-1/2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const btn = e.currentTarget as HTMLElement;
                      const rect = btn.getBoundingClientRect();
                      setAnchorRect(rect);
                      setOpenMenuId((prev) => (prev === c.id ? null : c.id));
                    }}
                    className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/5"
                    aria-label="More"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            ))}

          {/* archived list (when toggled) */}
          {!collapsed && showArchived && archivedList.length > 0 && (
            <div className="mt-3 px-3 text-xs text-gray-400">Archived</div>
          )}

          {!collapsed && showArchived && archivedList.map((c) => (
            <div key={`arch-${c.id}`} className="relative flex items-center group">
              <button onClick={() => onSelectChat(c.id)} className={`w-full h-10 rounded-lg hover:bg-white/5 px-3 text-left truncate`}>{c.title || 'New Chat'}</button>

              <div className="absolute right-1 top-1/2 -translate-y-1/2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const btn = e.currentTarget as HTMLElement;
                    const rect = btn.getBoundingClientRect();
                    setAnchorRect(rect);
                    setOpenMenuId((prev) => (prev === c.id ? null : c.id));
                  }}
                  className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/5"
                  aria-label="More"
                >
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* USER */}
        <div ref={ref} className="relative p-2 border-t border-white/5">
          {/* Changed from button -> div so we can render a proper Upgrade button inside without nested <button> */}
          <div
            onClick={() => guard(() => setMenuOpen((v) => !v))}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                guard(() => setMenuOpen((v) => !v));
              }
            }}
            className={`w-full h-auto py-2 rounded-xl hover:bg-white/5 flex items-center ${collapsed ? "justify-center px-0" : "gap-3 px-2"}`}
          >
            {/* avatar: if avatarPreview present show image, otherwise show initial with deterministic bg color */}
            {avatarPreview ? (
              // keep existing <img> approach (no need to switch to next/Image here)
              // if avatarPreview is a storage path you may want to convert to signed url before displaying
              <img src={avatarPreview} className="w-6 h-6 min-w-6 min-h-6 rounded-full shrink-0 object-cover" />
            ) : (
              <div
                className="w-6 h-6 min-w-6 min-h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold"
                style={{ backgroundColor: avatarColor || defaultAvatarBgColor, color: "#fff" }}
              >
                {avatarInitial}
              </div>
            )}
            {!collapsed && (
              <div className="flex flex-col gap-1 overflow-hidden w-full">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">{displayName || nameOrEmail(user)}</p>
                </div>

                <div className="flex items-center justify-between gap-2 mb-1">
                  {/* left status: Free / Go */}
                  <span className={`rounded-full text-[10px] px-2 py-0.5 ${isPro ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white" : "bg-white/5 text-gray-300"}`}>
                    {isPro ? "Pro" : "Free"}
                  </span>

                  {/* right: Upgrade button (only show if not Go) */}
                  {!isPro ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // open settings panel (upgrade area)
                        setSettingsOpen(true);
                        if (onOpenSettings) onOpenSettings();
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600/50 to-indigo-600/50 hover:opacity-80"
                    >
                      Upgrade
                    </button>
                  ) : (
                    // optional small badge when already Pro (keeps layout stable)
                    <span className="text-xs text-gray-400">Member</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {menuOpen && !collapsed && (
            <div className="absolute bottom-20 left-3 right-3 bg-[#1f1f1f] rounded-xl p-2 text-sm">
              <MenuItem label="Profile" onClick={() => { setProfileOpen(true); if (onOpenProfile) onOpenProfile(); }} />
              <MenuItem label="Settings" onClick={() => { setSettingsOpen(true); if (onOpenSettings) onOpenSettings(); }} />
              <button onClick={async () => { await supabase.auth.signOut(); location.href = "/login"; }} className="w-full text-left px-3 py-2 text-red-400 rounded-lg hover:bg-white/10">
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Portal dropdown: rendered outside sidebar (document.body) */}
      {typeof document !== "undefined" && openMenuId && anchorRect && createPortal(
        (() => {
          const active = recentChat.find((r) => r.id === openMenuId);
          if (!active) return null;

          const DROPDOWN_WIDTH = 220;
          let left = Math.min(Math.max(anchorRect.left, 8), window.innerWidth - DROPDOWN_WIDTH - 8);
          const top = anchorRect.bottom + 8;

          return (
            <div ref={dropdownRef} onClick={(e) => e.stopPropagation()} style={{ position: "fixed", top: `${top}px`, left: `${left}px`, width: DROPDOWN_WIDTH, zIndex: 9999 }} className="bg-[#111] rounded-xl border border-white/10 shadow-xl overflow-hidden text-sm">
              <button onClick={() => handleShareSession(active.id, active.title)} className="w-full px-3 py-2 flex items-center gap-2 hover:bg-white/5">
                <Share2 size={16} />
                Share
              </button>

              <button onClick={() => handleRenameSession(active.id, active.title)} className="w-full px-3 py-2 flex items-center gap-2 hover:bg-white/5">
                <Edit2 size={16} />
                Change name
              </button>

              <div className="h-px bg-white/5 my-1" />

              <button onClick={() => handleTogglePin(active.id, active.pinned)} className="w-full px-3 py-2 flex items-center gap-2 hover:bg-white/5">
                <Pin size={16} />
                {active.pinned ? "Unpin chat" : "Pin chat"}
              </button>

              <button onClick={() => handleToggleArchive(active.id, active.archived)} className="w-full px-3 py-2 flex items-center gap-2 hover:bg-white/5">
                <Archive size={16} />
                {active.archived ? "Restore from archive" : "Archive"}
              </button>

              <div className="h-px bg-white/5 my-1" />

              <button onClick={() => { handleDeleteSession(active.id); }} className="w-full px-3 py-2 flex items-center gap-2 text-red-400 hover:bg-red-500/10">
                <Trash2 size={16} />
                Delete chat
              </button>
            </div>
          );
        })(),
        document.body
      )}

      {/* Sidebar delete confirm modal */}
      <AnimatePresence>
        {deleteModalOpen && deleteTarget && (
          <motion.div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { if (!deleting) cancelDeleteSession(); }}>
            <motion.div onClick={(e) => e.stopPropagation()} initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} transition={{ duration: 0.12 }} className="w-[92%] max-w-md bg-[#111] rounded-2xl p-5">
              <h3 className="text-lg font-semibold">Delete Chat History</h3>
              <p className="text-sm text-gray-400 mt-2">
                Are you sure you want to delete this chat? This action cannot be undone. All messages in the chat will be deleted.
              </p>

              <div className="mt-4 flex gap-3 justify-end">
                <button onClick={cancelDeleteSession} disabled={deleting} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20">
                  Cancel
                </button>
                <button onClick={confirmDeleteSession} disabled={deleting} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700">
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PROFILE PANEL */}
      <AnimatePresence>
        {profileOpen && (
          <motion.div
            key="profile-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-70 bg-black/70 flex items-center justify-center"
            onClick={() => setProfileOpen(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-[95%] max-w-3xl bg-[#0b0b0b] rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Profile</h3>
                <div className="flex items-center gap-2">
                  {/* Close: revert form to saved state (but do not trigger storage actions) */}
                  <button onClick={() => { resetProfileForm(); setProfileOpen(false); }} className="px-3 py-1 rounded-lg bg-white/10">Close</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Avatar area */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="avatar preview" className="w-32 h-32 rounded-full object-cover" />
                    ) : (
                      <div style={{ backgroundColor: avatarColor || defaultAvatarBgColor }} className="w-32 h-32 rounded-full flex items-center justify-center text-3xl font-bold text-white">
                        {avatarInitial}
                      </div>
                    )}

                    {/* edit circle -> now toggles a panel (Camera/Album/Remove) */}
                    <div className="absolute right-0 bottom-0">
                      <button
                        onClick={() => setShowAvatarEditPanel((s) => !s)}
                        className="px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs flex items-center gap-1"
                        title="Edit avatar"
                      >
                        <Edit2 size={12} />
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* small edit panel (shows when edit clicked) */}
                  {showAvatarEditPanel && (
                    <div className="flex gap-2 items-center mt-1">
                      <button
                        onClick={() => { onTakeFromCamera(); setShowAvatarEditPanel(false); }}
                        className="px-3 py-1 rounded-lg bg-white/5 flex items-center gap-2"
                        title="Take from camera"
                      >
                        <Camera size={14} />
                        <span className="text-xs">Camera</span>
                      </button>

                      <button
                        onClick={() => { onChooseFromAlbum(); setShowAvatarEditPanel(false); }}
                        className="px-3 py-1 rounded-lg bg-white/5 flex items-center gap-2"
                        title="Choose from album"
                      >
                        <FileImage size={14} />
                        <span className="text-xs">Album</span>
                      </button>

                      <button
                        onClick={() => { onRemoveAvatar(); setShowAvatarEditPanel(false); }}
                        className="px-3 py-1 rounded-lg bg-white/5 flex items-center gap-2"
                        title="Remove avatar"
                      >
                        <Trash size={14} />
                        <span className="text-xs">Remove</span>
                      </button>
                    </div>
                  )}

                  <div className="w-full">
                    <div className="text-sm text-gray-400 mb-2">Pick palette color</div>
                    <div className="flex gap-2 flex-wrap">
                      {COLORS.map((c) => (
                        <button key={c} onClick={() => onPickColor(c)} style={{ backgroundColor: c }} className={`w-8 h-8 rounded-full ${avatarColor === c ? "ring-2 ring-white/30" : ""}`} />
                      ))}
                      <button onClick={() => setShowColorModal(true)} className="px-2 py-1 rounded-lg bg-white/5">Custom</button>
                    </div>
                  </div>
                </div>

                {/* Form area */}
                <div className="md:col-span-2">
                  <div className="mb-3">
                    <label className="text-xs text-gray-400">Name</label>
                    <input 
                    value={formName} 
                    onChange={(e) => setFormName(e.target.value)} 
                    className="w-full mt-1 p-2 rounded-lg bg-black/40 outline-none border-none  " />
                  </div>

                  <div className="mb-3">
                    <label className="text-xs text-gray-400">Username (e.g: @username)</label>
                    <input 
                    value={formUsername} 
                    onChange={(e) => setFormUsername(e.target.value)} 
                    placeholder="@username" 
                    className="w-full mt-1 p-2 rounded-lg bg-black/40 outline-none border-none" />
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button onClick={saveProfileToDb} disabled={savingProfile} className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:from-purple-700 active:to-indigo-700">{savingProfile ? "Saving..." : "Save"}</button>
                    <button onClick={handleCancel} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30">Cancel</button>
                    <button onClick={confirmReset} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30">Reset</button>
                  </div>

                  <div className="mt-4 text-sm text-gray-400">Profile data will be saved.</div>
                </div>
              </div>

              {/* Profile edit logs */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium mb-2">Edit log ({profileLogs.length})</h4>
                  <div>
                    <button onClick={handleClearLogs} className="text-xs px-2 py-1 rounded bg-white/5">Clear log</button>
                  </div>
                </div>

                <div className="max-h-36 overflow-auto bg-[#0b0b0b] rounded-lg p-3 border border-white/5">
                  {profileLogs.length === 0 ? (
                    <div className="text-xs text-gray-400">
No history yet. Any changes will be noted.</div>
                  ) : (
                    <ul className="space-y-2">
                      {profileLogs.map((l) => (
                        <li key={l.id} className="text-sm">
                          <div className="text-xs text-gray-400">{new Date(l.created_at).toLocaleString()}</div>
                          <pre className="text-xs whitespace-pre-wrap break-words bg-black/30 p-2 rounded">{JSON.stringify(l.changes)}</pre>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* color modal */}
      <AnimatePresence>
        {showColorModal && (
          <motion.div className="fixed inset-0 z-90 bg-black/70 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div onClick={(e) => e.stopPropagation()} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} transition={{ duration: 0.12 }} className="w-[92%] max-w-md bg-[#0b0b0b] rounded-2xl p-5">
              <h3 className="text-lg font-semibold mb-3">Custom color</h3>
              <p className="text-sm text-gray-400 mb-3">Enter the hex code (e.g: #ff0000) or select from the picker.</p>
              <input id="custom-color-input" placeholder="#ff0000" className="w-full p-2 rounded-lg bg-black/40 mb-3 outline-none border-none" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowColorModal(false)} className="px-3 py-1 rounded-lg bg-white/10
                hover:bg-white/20 active:bg-white/20">Cancel</button>
                <button onClick={() => {
                  const el = document.getElementById("custom-color-input") as HTMLInputElement | null;
                  const v = el?.value?.trim();
                  if (v && /^#([0-9A-F]{3}){1,2}$/i.test(v)) {
                    onPickColor(v);
                    setShowColorModal(false);
                  } else {
                    toast("Format hex tidak valid");
                  }
                }} className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600
                hover:bg-gradient-to-r hover:from-purple-700 hover:to-indigo-700
                active:bg-gradient-to-r active:from-purple-700 active:to-indigo-700">Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset confirm modal */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div className="fixed inset-0 z-100 bg-black/70 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div onClick={(e) => e.stopPropagation()} initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} transition={{ duration: 0.12 }} className="w-[92%] max-w-md bg-[#111] rounded-2xl p-5">
              <h3 className="text-lg font-semibold">Reset profile</h3>
              <p className="text-sm text-gray-400 mt-2">Are you sure you want to reset your profile? All changes will be lost and the profile will return to its initial state.</p>
              <div className="mt-4 flex gap-3 justify-end">
                <button onClick={() => setShowResetModal(false)} className="px-4 py-2 rounded-lg bg-white/10">Cancel</button>
                <button onClick={doResetToOriginal} className="px-4 py-2 rounded-lg bg-red-600">Reset</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear logs confirm modal */}
      <AnimatePresence>
        {showClearLogsModal && (
          <motion.div className="fixed inset-0 z-100 bg-black/70 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div onClick={(e) => e.stopPropagation()} initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} transition={{ duration: 0.12 }} className="w-[92%] max-w-md bg-[#111] rounded-2xl p-5">
              <h3 className="text-lg font-semibold">Delete Profile Logs</h3>
              <p className="text-sm text-gray-400 mt-2">Delete all profile edit history? This action is permanent.</p>
              <div className="mt-4 flex gap-3 justify-end">
                <button 
                onClick={() => setShowClearLogsModal(false)} 
                className="
                px-4 py-2 rounded-lg bg-white/10
                hover:bg-white/20 active:bg-white/20">
                  Cancel
                </button>
                <button 
                onClick={doClearLogs} 
                className="
                px-4 py-2 rounded-lg bg-red-600
                hover:bg-red-500 active:bg-red-500
                ">
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ================= ITEM ================= */
function Item({
  icon,
  label,
  collapsed,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full h-12 rounded-lg hover:bg-white/5
        flex items-center
        ${collapsed ? "justify-center px-0" : "gap-3 px-3"}
      `}
    >
      <div className="w-9 h-9 flex items-center justify-center shrink-0">
        {icon}
      </div>
      {!collapsed && <span>{label}</span>}
    </button>
  );
}

/* ================= MENU ITEM ================= */
function MenuItem({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10"
    >
      {label}
    </button>
  );
}

/* ================= helpers ================= */
function nameOrEmail(user: any) {
  return user?.user_metadata?.name || user?.email || "";
}
