export default function RegisterLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md text-white">

        {/* TITLE SKELETON */}
        <div className="mb-8 flex flex-col items-center space-y-2">
          <div className="h-6 w-48 rounded-full shimmer" />
          <div className="h-4 w-56 rounded-full shimmer" />
        </div>

        {/* CARD */}
        <div className="rounded-3xl bg-[#111] border border-white/5 p-6 space-y-5 shadow-xl">

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

          {/* PASSWORD */}
          <div className="h-11 rounded-xl shimmer" />

          {/* SUBMIT */}
          <div className="h-11 rounded-full shimmer" />

          {/* FOOTER TEXT */}
          <div className="h-3 w-44 mx-auto rounded-full shimmer" />
        </div>

        {/* DISCLAIMER */}
        <div className="mt-6 flex justify-center">
          <div className="h-3 w-60 rounded-full shimmer" />
        </div>
      </div>
    </div>
  );
}
