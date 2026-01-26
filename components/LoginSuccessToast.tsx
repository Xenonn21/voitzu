"use client";

import { useEffect, useRef, useState } from "react";

export default function LoginSuccessToast() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const flag = sessionStorage.getItem("login_success");

    if (flag === "1") {
      sessionStorage.removeItem("login_success");

      setMounted(true);

      requestAnimationFrame(() => {
        setVisible(true);
      });

      // hide animation
      setTimeout(() => {
        setVisible(false);
      }, 2000);

      // unmount
      setTimeout(() => {
        setMounted(false);
      }, 2300);
    }
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
        ${visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-2"}
      `}
    >
      {/* ICON */}
      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
        <svg
          className="w-4 h-4 text-green-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div>
        <p className="text-sm font-semibold text-white">
          Login successful
        </p>
        <p className="text-xs text-gray-400">
          Welcome back 🚀
        </p>
      </div>
    </div>
  );
}
