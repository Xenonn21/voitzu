"use client";

import { useEffect, useState, useRef } from "react";
// import ChatSidebar from "@/components/ChatSidebar";
import AuthButtons from "@/components/AuthButtons";
import ChatInput from "@/app/chat/components/ChatInput";
import TextAnimation from "@/app/chat/components/TextAnimation";

type Message = {
    id: number;
    role: "user" | "assistant";
    content: string;
};

export default function ChatClient() {
    // global state
    const [loggedIn, setLoggedIn] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [showScrollDown, setShowScrollDown] = useState(false);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const chatRef = useRef<HTMLDivElement | null>(null);

    // memeriksa pengguna sudah login
    useEffect(() => {
        // setLoggedIn(isLoggedIn());
    }, []);

    // scroll ke bawah
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // memeriksa apakah user sudah scroll ke bawah
    useEffect(() => {
        const el = chatRef.current;
        if (!el) return;

        const onScroll = () => {
            const isAtBottom =
                el.scrollHeight - el.scrollTop - el.clientHeight < 80;

            setShowScrollDown(!isAtBottom);
        };

        el.addEventListener("scroll", onScroll);
        return () => el.removeEventListener("scroll", onScroll);
    }, []);

    const handleSend = (text: string) => {
        setMessages((prev) => [
            ...prev,
            {
                id: Date.now(),
                role: "user",
                content: text,
            },
        ]);
    };

    return (
        <main className="min-h-screen bg-black text-white flex">
            <div className="flex-1 flex flex-col relative">
                {/* HEADER */}
                <header className="fixed bg-black top-0 w-full z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <div>
                        <h1 className="text-lg font-semibold">
                            Voi
                            <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
                                Tzu
                            </span>
                        </h1>
                        <p className="text-[8px] sm:text-[10px] tracking-widest text-gray-500 uppercase">
                            Arcana Void Intelligence
                        </p>
                    </div>

                    {!loggedIn && <AuthButtons />}
                </header>

                {/* CHAT */}
                <div className="flex-1 flex flex-col pt-[72px]">
                    <section ref={chatRef} className="flex-1 overflow-y-auto">
                        {messages.length === 0 && <TextAnimation />}

                        <div className="mx-auto max-w-4xl px-6 py-8 space-y-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"
                                        }`}
                                >
                                    {msg.role === "assistant" && (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                            AI
                                        </div>
                                    )}

                                    <div
                                        className={`
                      w-fit
                      max-w-[85%] sm:max-w-[75%]
                      break-all whitespace-pre-wrap
                      px-4 py-2 text-sm leading-relaxed
                      break-words whitespace-pre-wrap
                      ${msg.role === "user"
                                                ? "bg-[#2f2f2f] rounded-2xl rounded-br-sm"
                                                : "bg-[#1f1f1f] rounded-2xl rounded-bl-sm"
                                            }
                    `}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}

                            <div ref={bottomRef} />
                        </div>
                    </section>

                    {showScrollDown && (
                        <button
                            onClick={() =>
                                bottomRef.current?.scrollIntoView({ behavior: "smooth" })
                            }
                            className="fixed bottom-[96px] left-1/2 -translate-x-1/2 z-20 w-10 h-10 rounded-full bg-[#2f2f2f] hover:bg-[#3a3a3a] flex items-center justify-center shadow-lg transition"
                        >
                            ↓
                        </button>
                    )}

                    <footer className="fixed bottom-0 w-full z-10 bg-black">
                        <div className="mx-auto max-w-4xl px-6">
                            <ChatInput onSend={handleSend} />
                            <p className="text-[10px] pb-4 text-gray-500 text-center">
                                VoiTzu may generate inaccurate information.
                            </p>
                        </div>
                    </footer>
                </div>
            </div>
        </main>
    );
}
