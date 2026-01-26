"use client";

// import state
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BackToApp from "@/components/BackToApp";
import { supabase } from "@/app/lib/supabase";

export default function RegisterPage() {

    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const form = e.currentTarget;
        const email = (form.email as HTMLInputElement).value;
        const password = (form.password as HTMLInputElement).value;

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            let data;
            try {
                data = await res.json();
            } catch {
                throw new Error("Server error");
            }

            if (!res.ok) {
                setError(data.error || "Register failed");
                setLoading(false);
                return;
            }

            // ✅ REGISTER EMAIL/PASSWORD → LOGIN PAGE

            router.push("/login?success=1");

        } catch (err) {
            setError("Something went wrong, please try again");
            setLoading(false);
        }
    };


    const google = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            },
        });

        if (error) {
            console.error(error.message);
        }
    };

    return (
        <main className="min-h-screen bg-black flex items-center justify-center px-4 text-white">
            <BackToApp />
            <div className="w-full max-w-md">

                {/* LOGO / TITLE */}
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-semibold">
                        Join{" "}
                        <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
                            VoiTzu
                        </span>
                    </h1>
                    <p className="mt-2 text-sm text-gray-400">
                        Create your account to continue
                    </p>
                </div>

                {/* CARD */}
                <div className="rounded-3xl bg-[#111] border border-white/5 p-6 space-y-5 shadow-xl">

                    {/* GOOGLE */}
                    <button
                        type="button"
                        onClick={google}
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
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-4">
                        <input
                            name="email"
                            type="email"
                            placeholder="Email address"
                            required
                            className="
                w-full h-11 px-4 rounded-xl
                bg-[#1a1a1a]
                outline-none border-none
                placeholder:text-gray-500
              "
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
      outline-none border-none
      placeholder:text-gray-500
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
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12" />
                                        <path d="M1 1l22 22" />
                                    </svg>
                                ) : (
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

                        {/* SUBMIT */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="
                w-full h-11 rounded-full
                bg-gradient-to-r from-purple-500 to-indigo-600
                hover:opacity-90
                active:scale-95
                transition
                font-medium
              "
                        >
                            {loading ? "Createing account..." : "Create account"}
                        </button>
                    </form>

                    {/* FOOTER */}
                    <p className="text-center text-xs text-gray-400">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="text-purple-400 hover:text-purple-300"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>

                {/* DISCLAIMER */}
                <p className="mt-6 text-center text-[10px] text-gray-500">
                    By continuing, you agree to our Terms & Privacy Policy.
                </p>
            </div>
        </main>
    );
}
