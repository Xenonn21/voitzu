"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BackToApp from "@/components/BackToApp";
import SuccessToast from "@/components/SuccessToast";
import { supabase } from "@/app/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ======================
  // EMAIL / PASSWORD LOGIN
  // ======================
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const email = (form.email as HTMLInputElement).value;
    const password = (form.password as HTMLInputElement).value;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // ✅ sukses login
    router.replace("/chat");
  };

  // ======================
  // GOOGLE OAUTH LOGIN
  // ======================
  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4 text-white">
      <SuccessToast />
      <BackToApp />

      <div className="w-full max-w-md">
        {/* TITLE */}
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
        <div className="rounded-3xl bg-[#111] border border-white/5 p-6 space-y-5 shadow-xl">
          {/* GOOGLE */}
          <button
            onClick={loginWithGoogle}
            type="button"
            className="w-full h-11 rounded-full flex items-center justify-center gap-3 bg-white text-black hover:bg-gray-100 transition"
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              name="email"
              type="email"
              required
              placeholder="Email address"
              className="w-full h-11 px-4 rounded-xl bg-[#1a1a1a] outline-none border-none placeholder:text-gray-500"
            />

            <div className="relative">
  <input
    name="password"
    type={showPassword ? "text" : "password"}
    required
    placeholder="Password"
    className="
      w-full h-11 px-4 pr-11 rounded-xl
      bg-[#1a1a1a]
      placeholder:text-gray-500
      outline-none border-none
    "
  />

  <button
    type="button"
    onClick={() => setShowPassword(v => !v)}
    className="
      absolute right-3 top-1/2 -translate-y-1/2
      text-gray-400 hover:text-white
      transition
    "
  >
    {showPassword ? (
      /* Eye Off */
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.73-1.61 1.81-3.06 3.17-4.27" />
        <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
        <path d="M1 1l22 22" />
        <path d="M14.12 9.88A2 2 0 0 0 12 10" />
        <path d="M23 12c-.69 1.53-1.72 2.93-3 4.12" />
      </svg>
    ) : (
      /* Eye */
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )}
  </button>
</div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90 active:scale-95 transition font-medium"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* LINKS */}
          <div className="flex justify-between text-xs text-gray-400">
            <Link href="/forgot-password" className="hover:text-purple-400">
              Forgot password?
            </Link>
            <Link href="/register" className="hover:text-purple-400">
              Create account
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-[10px] text-gray-500">
          Protected by VoiTzu security system.
        </p>
      </div>
    </main>
  );
}
