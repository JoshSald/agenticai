import { useState } from "react";
import {
  ChatContainerContent,
  ChatContainerRoot,
} from "@/components/ui/chat-container";
import { Message, MessageContent } from "@/components/ui/message";
import { Loader } from "./ui/loader";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from "@/components/ui/prompt-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUp } from "lucide-react";
import type { AgentResponse } from "../types";

type Album = {
  artist: string;
  album: string;
  era?: string;
  coverArt?: string;
};

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  albums?: Album[];
};

export default function ChatView() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const variant = "loading-dots"; // Loader Variant

  const sendPrompt = async () => {
    if (!prompt.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: prompt.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage.content }),
      });

      const data: AgentResponse = await res.json();

      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.recommendations,
        albums: data.matches,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Failed to send prompt", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-neutral-900">
      {/* Chat area */}
      <ChatContainerRoot className="flex-1 overflow-y-auto">
        <ChatContainerContent className="space-y-6 px-4 py-8">
          {messages.map((message) => {
            const isAssistant = message.role === "assistant";

            return (
              <Message
                key={message.id}
                className={cn(
                  "mx-auto flex w-full max-w-3xl flex-col",
                  isAssistant ? "items-start" : "items-end",
                )}
              >
                {isAssistant ? (
                  <div className="max-w-[75%] space-y-4">
                    {/* Assistant text */}
                    <MessageContent
                      className="
                        bg-slate-300
                        prose
                        rounded-2xl
                        px-4
                        py-3
                        shadow-sm
                      "
                      markdown
                    >
                      {message.content}
                    </MessageContent>

                    {/* Album grid */}
                    {message.albums && message.albums.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {message.albums.map((album) => (
                          <div
                            key={`${album.artist}-${album.album}`}
                            className="rounded-lg bg-neutral-800 p-2 shadow-sm"
                          >
                            {album.coverArt ? (
                              <img
                                src={album.coverArt}
                                alt={album.album}
                                className="mb-2 aspect-square w-full rounded-md object-cover"
                              />
                            ) : (
                              <div className="mb-2 aspect-square w-full rounded-md bg-neutral-700 flex items-center justify-center text-xs text-neutral-300">
                                No cover
                              </div>
                            )}

                            <div className="text-sm font-semibold text-white leading-tight">
                              {album.album}
                            </div>
                            <div className="text-xs text-neutral-400">
                              {album.artist}
                            </div>
                            {album.era && (
                              <div className="text-xs text-neutral-500">
                                {album.era}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <MessageContent
                    className="
                      bg-sky-900
                      text-white
                      max-w-[75%]
                      rounded-3xl
                      px-4
                      py-2.5
                      shadow-sm
                    "
                  >
                    {message.content}
                  </MessageContent>
                )}
              </Message>
            );
          })}

          {loading && (
            <Message className="items-start mx-auto max-w-3xl">
              <MessageContent className="bg-neutral-700 rounded-2xl px-4 py-3 text-sm text-neutral-200">
                <div
                  key={variant}
                  className="flex flex-col items-center justify-center gap-2 p-2"
                >
                  <Loader variant={variant} />
                </div>
              </MessageContent>
            </Message>
          )}
        </ChatContainerContent>
      </ChatContainerRoot>

      {/* Input */}
      <div className="border-t border-neutral-700 bg-neutral-900 p-3">
        <PromptInput
          value={prompt}
          onValueChange={setPrompt}
          onSubmit={sendPrompt}
          isLoading={loading}
          className="rounded-3xl border border-neutral-600 bg-neutral-800"
        >
          <PromptInputTextarea
            placeholder="Tell me what music you like…"
            className="min-h-[44px] text-white placeholder:text-neutral-400"
          />

          <PromptInputActions className="flex justify-end px-2 pb-2">
            <PromptInputAction>
              <Button
                size="icon"
                disabled={!prompt.trim() || loading}
                onClick={sendPrompt}
                className="rounded-full bg-black text-white"
              >
                <ArrowUp size={18} />
              </Button>
            </PromptInputAction>
          </PromptInputActions>
        </PromptInput>
      </div>
    </div>
  );
}
