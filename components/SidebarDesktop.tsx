"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu, X, Plus, Search, Image as ImageIcon } from "lucide-react";

export default function SidebarDesktop({ user }: { user: any }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      onClick={() => collapsed && setCollapsed(false)}
      className={`
        hidden sm:flex
        sticky top-0 h-screen
        bg-black/70 backdrop-blur
        border-r border-white/5
        flex-col
        transition-all duration-300
        ${collapsed ? "w-16" : "w-60"}
      `}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between p-4">
        <Image src="/favicon.ico" alt="Voitzu" width={26} height={26} />

        {!collapsed && (
          <button onClick={() => setCollapsed(true)}>
            <X size={18} />
          </button>
        )}
      </div>
    </aside>
  );
}

function SidebarItem({
  icon,
  label,
  collapsed,
}: {
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
}) {
  return (
    <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5">
      {icon}
      {!collapsed && <span className="text-sm">{label}</span>}
    </button>
  );
}
