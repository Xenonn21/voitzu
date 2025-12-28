import ChatClient from "@/app/chat/ChatClient";

export default async function ChatPage() {
  // trigger Next.js route loading
  await new Promise((resolve) => setTimeout(resolve, 600));

  return <ChatClient />;
}
