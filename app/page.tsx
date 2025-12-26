import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white overflow-hidden">
      
      {/* Ambient Ornaments */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/2 translate-x-1/2 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-3xl" />

      <section className="text-center max-w-xl px-6 relative z-10">

        {/* Brand Mark */}
        <div className="mb-6 text-[10px] tracking-[0.35em] text-gray-500 uppercase">
          Arcana · Void
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold tracking-wide">
          Voi
          <span className="bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 bg-clip-text text-transparent">
            Tzu
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-2 text-[10px] tracking-widest text-gray-400 uppercase">
          Powered by <span className="text-white">AVOID</span>
        </p>

        {/* Divider */}
        <div className="mx-auto mt-6 h-px w-24 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

        {/* Description */}
        <p className="mt-6 text-sm text-gray-300 leading-relaxed">
          Intelligence born from the void.
          <br />
          Listen, ask, and discover answers.
        </p>

        {/* Primary CTA */}
<Link
  href="/chat"
  className="
    group relative inline-flex items-center gap-3
    mt-12 px-9 py-3.5
    rounded-[14px]
    bg-gradient-to-r from-purple-600 to-indigo-600
    transition-all duration-300 ease-out
    font-medium
    overflow-hidden

    hover:from-purple-700 hover:to-indigo-700
    hover:-translate-y-[1px]
    active:translate-y-[1px]
  "
>
  {/* Light sweep */}
  <span
    className="
      absolute inset-0
      bg-gradient-to-tr from-white/0 via-white/15 to-white/0
      opacity-0
      group-hover:opacity-100
      transition-opacity duration-300
    "
  />

  {/* TEXT MORPH */}
  <span className="relative z-10 h-[1.2em] overflow-hidden">
    <span className="block transition-transform duration-300 group-hover:-translate-y-full">
      Start Chat
    </span>
    <span className="block transition-transform duration-300 group-hover:-translate-y-full">
      Enter Void
    </span>
  </span>

  {/* ICON MORPH */}
  <span className="relative z-10 w-4 h-4 overflow-hidden">
    <svg
      className="
        absolute inset-0
        transition-transform duration-300
        group-hover:translate-x-full
      "
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>

    <svg
      className="
        absolute inset-0 -translate-x-full
        transition-transform duration-300
        group-hover:translate-x-0
      "
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.5 4L18 8.5l-4.5 1.5L12 14l-1.5-4L6 8.5l4.5-1.5L12 3z" />
    </svg>
  </span>

  {/* Subtle inner border */}
  <span className="absolute inset-0 rounded-[14px] ring-1 ring-white/15" />
</Link>

        {/* Auth Actions */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400">
          <Link href="/login" className="hover:text-white transition">
            Login
          </Link>
          <span className="opacity-40">•</span>
          <Link href="/register" className="hover:text-white transition">
            Register
          </Link>
        </div>

        {/* Micro Branding */}
        <p className="mt-8 text-[9px] tracking-widest text-gray-500 uppercase">
          Intelligence beyond interface
        </p>

      </section>
    </main>
  );
}
