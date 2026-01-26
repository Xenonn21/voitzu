"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function AuthCallback() {
    const router = useRouter();

    useEffect(() => {
        const finishLogin = async () => {
            const { data, error } = await supabase.auth.getSession();

            if (error || !data.session) {
                router.replace("/login");
                return;
            }

            sessionStorage.setItem("login_success", "1");
            router.replace("/chat");
        };

        finishLogin();

    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center text-white">
            Signing you in...
        </div>
    )
}