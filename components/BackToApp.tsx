"use client";

import Link from "next/link";

export default function BackToApp() {
  return (
    <Link
      href="/chat"
      className="
        absolute top-6 left-6 z-20
        flex items-center gap-2
        text-sm font-medium
        text-gray-400
        px-3 py-1.5
        rounded-full
        backdrop-blur
        bg-white/5
        border border-white/10

        hover:text-white
        hover:border-purple-500/40
        hover:bg-gradient-to-r
        hover:from-purple-500/10
        hover:to-indigo-500/10

        transition-all duration-200
        group
      "
    >
      {/* ICON */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="
          w-4 h-4
          stroke-current
          group-hover:-translate-x-0.5
          transition-transform
        "
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 12H6" />
        <path d="M12 5l-7 7 7 7" />
      </svg>

      <span>Back</span>
    </Link>
  );
}
