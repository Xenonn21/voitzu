"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function SuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const hasRun = useRef(false); // ⛔ cegah double effect (React Strict Mode)

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const success = searchParams.get("success");

    if (success === "1") {
      setMounted(true);

      // hapus query param TANPA reload
      router.replace("/login", { scroll: false });

      // animasi masuk
      requestAnimationFrame(() => {
        setVisible(true);
      });

      // animasi keluar
      setTimeout(() => {
        setVisible(false);
      }, 1800);

      // unmount
      setTimeout(() => {
        setMounted(false);
      }, 2000);
    }
  }, [searchParams, router]);

  if (!mounted) return null;

  return (
    <div
      className={`
        fixed top-6 right-6 z-50
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
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>

      <div>
        <p className="text-sm font-semibold text-white">
          Account created successfully
        </p>
        <p className="text-xs text-gray-400">
          You can now sign in 🚀
        </p>
      </div>
    </div>
  );
}
