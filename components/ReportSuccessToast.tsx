// components/ReportSuccessToast.tsx
"use client";

import { useEffect, useRef, useState } from "react";

export default function ReportSuccessToast() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
  const handler = () => showOnce();
  window.addEventListener("report_success", handler);
  return () => window.removeEventListener("report_success", handler);
}, []);

  const showOnce = () => {
    // restart animation jika sedang tampil
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setMounted(true);
    requestAnimationFrame(() => setVisible(true));

    // hide after 2s
    timeoutRef.current = window.setTimeout(() => {
      setVisible(false);
      // unmount after exit animation
      timeoutRef.current = window.setTimeout(() => {
        setMounted(false);
        timeoutRef.current = null;
      }, 300);
    }, 2000);
  };

  useEffect(() => {
    // handler dipanggil ketika event custom dikirim
    const handler = (e: Event) => {
      // optionally, jika menggunakan CustomEvent dengan detail, bisa cek e.detail di sini
      showOnce();
    };

    // hanya listen pada event custom; tidak lagi check sessionStorage saat mount
    if (typeof window !== "undefined") {
      window.addEventListener("report_success", handler);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("report_success", handler);
      }
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={`
        fixed top-6 right-6 z-[9999]
        flex items-center gap-3
        px-5 py-3
        rounded-xl
        bg-[#111]
        border border-green-500/30
        shadow-2xl
        transition-all duration-300 ease-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}
      `}
      style={{ position: "fixed" }}
    >
      {/* verified badge (top-right of the toast) */}
      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-green-600/95 flex items-center justify-center shadow-lg">
        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* ICON */}
      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
        <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div>
        <p className="text-sm font-semibold text-white">Laporan terkirim</p>
        <p className="text-xs text-gray-400">Terima kasih, tim kami akan meninjau laporan.</p>
      </div>
    </div>
  );
}
