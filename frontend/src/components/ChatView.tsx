import { useState } from "react";
import {
  ChatContainerContent,
  ChatContainerRoot,
} from "@/components/ui/chat-container";
import { Message, MessageContent } from "@/components/ui/message";
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

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  albums?: {
    artist: string;
    album: string;
    era?: string;
    coverArt?: string;
  }[];
};

export default function ChatView() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-800 flex h-[100vh] w-full flex-col overflow-hidden border bg-muted/40 shadow-lg">
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
                  <MessageContent
                    className="
                      bg-slate-300
                      prose
                      max-w-[75%]
                      rounded-2xl
                      px-4
                      py-3
                      shadow-sm
                    "
                    markdown
                  >
                    {message.content}
                  </MessageContent>
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
              <MessageContent className="bg-muted rounded-2xl px-4 py-3 text-sm text-neutral-200">
                Thinking…
              </MessageContent>
            </Message>
          )}
        </ChatContainerContent>
      </ChatContainerRoot>

      {/* Input */}
      <div className="bg-background p-3">
        <PromptInput
          value={prompt}
          onValueChange={setPrompt}
          onSubmit={sendPrompt}
          isLoading={loading}
          className="rounded-3xl border border-neutral-500 text-white"
        >
          <PromptInputTextarea
            placeholder="Tell me what music you like…"
            className="min-h-[44px]"
          />

          <PromptInputActions className="flex justify-end px-2 pb-2">
            <PromptInputAction>
              <Button
                size="icon"
                disabled={!prompt.trim() || loading}
                onClick={sendPrompt}
                className="rounded-full bg-black color-white"
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
