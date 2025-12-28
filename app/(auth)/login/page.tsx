import Link from "next/link";
import BackToApp from "@/components/BackToApp";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4 text-white">
        <BackToApp />
      <div className="w-full max-w-md">

        {/* LOGO / TITLE */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold">
            Welcome Back{" "}
            <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
              VoiTzu
            </span>
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Sign in to continue your journey
          </p>
        </div>

        {/* CARD */}
        <div className="w-full rounded-3xl bg-[#111] border border-white/5 p-6 space-y-5 shadow-xl">

          {/* GOOGLE */}
          <button
            className="
              w-full h-11 rounded-full
              flex items-center justify-center gap-3
              bg-white text-black
              hover:bg-gray-100
              transition
            "
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Continue with Google
          </button>

          {/* APPLE */}
          <button
            className="
              w-full h-11 rounded-full
              flex items-center justify-center gap-3
              bg-black border border-white/20
              hover:bg-white/5
              transition
            "
          >
            <i className="fa-brands fa-apple text-lg"></i>
            Continue with Apple
          </button>

          {/* DIVIDER */}
          <div className="flex items-center gap-3">
            <span className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-400">OR</span>
            <span className="flex-1 h-px bg-white/10" />
          </div>

          {/* EMAIL FORM */}
          <form className="space-y-4">
            <input
              type="email"
              placeholder="Email address"
              className="
                w-full h-11 px-4 rounded-xl
                bg-[#1a1a1a]
                border border-white/10
                placeholder:text-gray-500
                focus:outline-none focus:border-purple-500
              "
            />

            <input
              type="password"
              placeholder="Password"
              className="
                w-full h-11 px-4 rounded-xl
                bg-[#1a1a1a]
                border border-white/10
                placeholder:text-gray-500
                focus:outline-none focus:border-purple-500
              "
            />

            {/* SUBMIT */}
            <button
              type="submit"
              className="
                w-full h-11 rounded-full
                bg-gradient-to-r from-purple-500 to-indigo-600
                hover:opacity-90
                active:scale-95
                transition
                font-medium
              "
            >
              Sign In
            </button>
          </form>

          {/* EXTRA LINKS */}
          <div className="flex justify-between text-xs text-gray-400">
            <Link
              href="/forgot-password"
              className="hover:text-purple-400"
            >
              Forgot password?
            </Link>

            <Link
              href="/register"
              className="hover:text-purple-400"
            >
              Create account
            </Link>
          </div>
        </div>

        {/* DISCLAIMER */}
        <p className="mt-6 text-center text-[10px] text-gray-500">
          Protected by VoiTzu security system.
        </p>
      </div>
    </main>
  );
}
