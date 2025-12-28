export default function ChatLoading() {
  return (
    <main className="min-h-screen bg-black text-white flex">
      <div className="flex-1 flex flex-col relative">

        {/* HEADER (SKELETON) */}
        <header className="fixed bg-black top-0 w-full z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="space-y-1">
            <div className="h-4 w-20 rounded shimmer" />
            <div className="h-2 w-32 rounded shimmer" />
          </div>

          <div className="flex gap-2">
            <div className="h-8 w-20 rounded-full shimmer" />
            <div className="h-8 w-20 rounded-full shimmer" />
          </div>
        </header>

        {/* CHAT AREA */}
        <div className="flex-1 flex flex-col pt-[72px]">

          <section className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-4xl px-6 py-8 space-y-4">

              {/* AI MESSAGE */}
              <div className="flex items-end gap-2 justify-start">
                <div className="w-8 h-8 rounded-full shimmer" />
                <div className="px-4 py-2 rounded-2xl rounded-bl-sm bg-[#1f1f1f]">
                  <div className="h-3 w-[180px] mb-2 rounded shimmer" />
                  <div className="h-3 w-[260px] rounded shimmer" />
                </div>
              </div>

              {/* USER MESSAGE */}
              <div className="flex items-end gap-2 justify-end">
                <div className="px-4 py-2 rounded-2xl rounded-br-sm bg-[#2f2f2f]">
                  <div className="h-3 w-[200px] rounded shimmer" />
                </div>
              </div>

              {/* AI MESSAGE */}
              <div className="flex items-end gap-2 justify-start">
                <div className="w-8 h-8 rounded-full shimmer" />
                <div className="px-4 py-2 rounded-2xl rounded-bl-sm bg-[#1f1f1f]">
                  <div className="h-3 w-[140px] mb-2 rounded shimmer" />
                  <div className="h-3 w-[220px] rounded shimmer" />
                </div>
              </div>

            </div>
          </section>

          {/* INPUT BAR SKELETON */}
          <footer className="fixed bottom-0 w-full z-10 bg-black">
            <div className="mx-auto max-w-4xl px-6 pb-4">
              <div className="relative w-full h-[56px] bg-[#2f2f2f] rounded-4xl overflow-hidden">
                <div className="absolute left-3 bottom-3 w-8 h-8 rounded-full shimmer" />
                <div className="absolute right-3 bottom-3 w-8 h-8 rounded-full shimmer" />
                <div className="absolute inset-y-3 left-14 right-14 h-4 rounded shimmer" />
              </div>

              <div className="mt-3 flex justify-center">
                <div className="h-2 w-48 rounded shimmer" />
              </div>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
