export default function AuthLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* TITLE */}
        <div className="mb-8 space-y-2 flex flex-col items-center">
          <div className="h-6 w-60 rounded-full shimmer" />
          <div className="h-4 w-44 rounded-full shimmer" />
        </div>

        {/* CARD */}
        <div className="rounded-3xl w-full bg-[#111] border border-white/5 p-6 space-y-5 shadow-xl">

          {/* GOOGLE */}
          <div className="h-11 rounded-full shimmer" />

          {/* APPLE */}
          <div className="h-11 rounded-full shimmer" />

          {/* DIVIDER */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <div className="h-3 w-8 rounded-full shimmer" />
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* EMAIL */}
          <div className="h-11 rounded-xl shimmer" />
          <div className="h-11 rounded-xl shimmer" />

          {/* SUBMIT */}
          <div className="h-11 rounded-full shimmer" />

          {/* EXTRA LINKS (Forgot + Create) */}
          <div className="flex justify-between mt-1">
            <div className="h-3 w-20 rounded-full shimmer" />
            <div className="h-3 w-20 rounded-full shimmer" />
          </div>
        </div>

        {/* DISCLAIMER */}
        <div className="mt-6 flex justify-center">
          <div className="h-3 w-40 rounded-full shimmer" />
        </div>
      </div>
    </div>
  );
}
