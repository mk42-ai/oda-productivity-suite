"use client";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { setSettings, getSettings } from "@/lib/settings";
/** Puts the organisation into the chat context and opens /chat with a starter question (AutoAsk reads ?q=). */
export function AskInChat({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  return (
    <button type="button" data-testid="ask-in-chat" onClick={() => { const cur = getSettings().companies.filter((x) => x !== id); setSettings({ companies: [id, ...cur].slice(0, 5) }); router.push(`/chat?q=${encodeURIComponent(`What has ${name} announced recently, and what is the public sentiment around it?`)}`); }}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#147B58] px-3 text-sm font-semibold text-white hover:bg-[#11694B]"><MessageSquare className="size-4" aria-hidden />Ask the analyst</button>
  );
}
