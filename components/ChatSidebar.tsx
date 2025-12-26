export default function ChatSidebar() {
  return (
    <aside className="
      w-72 h-full
      border-l border-white/5
      bg-black/60 backdrop-blur
      flex flex-col
    ">

      {/* New Chat */}
      <button className="
        m-4 px-4 py-3 rounded-xl
        bg-gradient-to-r from-purple-600 to-indigo-600
        hover:from-purple-700 hover:to-indigo-700
        transition text-sm font-medium
      ">
        + New Chat
      </button>

      {/* History */}
      <div className="flex-1 px-4 space-y-2 overflow-y-auto">
        {["What is void?", "Explain Arcana", "Who am I?"].map((item, i) => (
          <div
            key={i}
            className="
              px-3 py-2 rounded-lg
              text-sm text-gray-300
              hover:bg-white/5 cursor-pointer
            "
          >
            {item}
          </div>
        ))}
      </div>

      {/* User */}
      <div className="p-4 border-t border-white/5 text-xs text-gray-400">
        Logged as <span className="text-white">Raditya</span>
      </div>
    </aside>
  );
}
