"use client";

export default function ChatLoading() {
  return (
    <div className="flex items-end gap-2 justify-start">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-[#2a2a2a] shrink-0 shimmer" />

      {/* ❗ Bubble CHAT — UKURAN TIDAK DIUBAH */}
      <div
        className="
          max-w-full sm:max-w-[75%]
          px-4 py-2
          rounded-2xl rounded-bl-sm
          bg-[#1f1f1f]
        "
      >
        {/* Fake text lines */}
        <div className="h-3 w-[180px] rounded mb-2 shimmer" />
        <div className="h-3 w-[240px] rounded shimmer" />
      </div>
    </div>
  );
}
