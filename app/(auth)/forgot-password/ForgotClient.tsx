"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSent(true);
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-2xl font-semibold text-white">
            Forgot your password?
          </h1>
          <p className="text-sm text-gray-400">
            Enter your email and we’ll send you a reset link
          </p>
        </div>

        <div className="rounded-3xl bg-[#111] border border-white/5 p-6 shadow-xl">
          {sent ? (
            <div className="text-center space-y-3">
              <p className="text-green-400 text-sm">
                Reset link has been sent.
              </p>
              <Link href="/login" className="text-indigo-400 text-sm">
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-[#1a1a1a] text-white
                border border-transparent border-none outline-none
                transition duration-200
                appearance-none"
              />
              <button
                disabled={loading}
                className="w-full h-11 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
