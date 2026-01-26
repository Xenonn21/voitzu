"use client";

import Image from "next/image";
import { X, Plus, Search, Image as ImageIcon } from "lucide-react";

export default function SidebarMobile({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: any;
}) {
  return (
    <>
      {/* BACKDROP */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 sm:hidden"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-70
          bg-black/80 backdrop-blur
          border-r border-white/5
          flex flex-col
          transition-transform duration-300
          sm:hidden
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-4">
          <Image src="/favicon.ico" alt="Voitzu" width={26} height={26} />
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}

function SidebarItem({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5">
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}
