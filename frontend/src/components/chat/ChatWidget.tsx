"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ImagePlus, MessageCircle, Send, X } from "lucide-react";
import { getAuthState, subscribeAuthState } from "@/lib/auth-storage";
import {
  fetchConversationMessages,
  fetchConversations,
  sendChatMessage,
  type ChatImageInput,
  type ChatConversation,
  type ChatMessage,
} from "@/lib/chat";

export function ChatWidget() {
  const authState = useSyncExternalStore(subscribeAuthState, getAuthState, () => null);
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [queuedImages, setQueuedImages] = useState<ChatImageInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [remainingMessages, setRemainingMessages] = useState<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isAuthenticated = isMounted && Boolean(authState?.token);

  useEffect(() => {
    if (!isMounted || typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);
    const shouldOpen = url.searchParams.get("openChat") === "1" || url.hash === "#open-chat";

    if (!shouldOpen) {
      return;
    }

    if (!isAuthenticated) {
      const redirectTarget = `${url.pathname}${url.search}${url.hash}`;
      const encoded = encodeURIComponent(redirectTarget || "/");
      window.location.href = `/login?redirect=${encoded}`;
      return;
    }

    setIsOpen(true);
    url.searchParams.delete("openChat");
    if (url.hash === "#open-chat") {
      url.hash = "";
    }
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [isMounted, isAuthenticated]);

  useEffect(() => {
    if (!isOpen || !isAuthenticated) {
      return;
    }

    const loadConversations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchConversations();
        setConversations(data);

        if (data.length > 0) {
          setActiveConversationId(data[0]._id);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load conversations");
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, [isOpen, isAuthenticated]);

  useEffect(() => {
    if (!activeConversationId || !isOpen || !isAuthenticated) {
      return;
    }

    const loadMessages = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchConversationMessages(activeConversationId);
        setMessages(data.messages);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load messages");
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [activeConversationId, isOpen, isAuthenticated]);

  const onSend = async () => {
    if ((!draft.trim() && queuedImages.length === 0) || !isAuthenticated || isSending) {
      return;
    }

    const userMessage = draft.trim() || "Please analyze this pet image and provide guidance.";
    setDraft("");
    setIsSending(true);
    setError(null);

    const optimisticUserMessage: ChatMessage = {
      _id: `tmp-${Date.now()}`,
      conversation: activeConversationId || "",
      role: "user",
      content: userMessage,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);

    try {
      const response = await sendChatMessage(
        userMessage,
        activeConversationId || undefined,
        queuedImages
      );

      if (!response) {
        throw new Error("No response from chat service");
      }

      setActiveConversationId(response.conversation._id);
      setRemainingMessages(response.remainingMessages);

      const assistantMessage: ChatMessage = {
        _id: response.message._id,
        conversation: response.conversation._id,
        role: "assistant",
        content: response.reply,
        createdAt: response.message.createdAt,
      };

      setMessages((prev) => {
        const withoutOptimistic = prev.filter((item) => !item._id.startsWith("tmp-"));
        return [
          ...withoutOptimistic,
          {
            _id: `sent-${Date.now()}`,
            conversation: response.conversation._id,
            role: "user",
            content: userMessage,
            createdAt: new Date().toISOString(),
          },
          assistantMessage,
        ];
      });

      const latestConversations = await fetchConversations();
      setConversations(latestConversations);
      setQueuedImages([]);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Failed to send message");
      setMessages((prev) => prev.filter((item) => !item._id.startsWith("tmp-")));
      setDraft(userMessage);
    } finally {
      setIsSending(false);
    }
  };

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    const selected = files.slice(0, 3);

    try {
      const encoded = await Promise.all(
        selected.map(async (file) => {
          const supported = ["image/jpeg", "image/png", "image/webp"];
          const mime = supported.includes(file.type) ? file.type : "image/jpeg";
          const dataBase64 = await fileToBase64(file);
          return {
            mimeType: mime as ChatImageInput["mimeType"],
            dataBase64,
          };
        })
      );

      setQueuedImages(encoded);
    } catch {
      setError("Unable to process selected image files.");
    } finally {
      event.target.value = "";
    }
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed bottom-3 right-3 z-50 sm:bottom-5 sm:right-5">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#2f66ff] text-white shadow-xl shadow-[#2f66ff]/40"
          aria-label="Open chat assistant"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {isOpen && (
        <div className="h-[min(78vh,620px)] w-[min(96vw,430px)] overflow-hidden rounded-2xl border border-[#d6e0f5] bg-white shadow-2xl sm:w-[420px]">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-[#f8fbff] px-4 py-3">
            <div>
              <p className="text-sm font-bold text-[#0f172a]">PetAI Assistant</p>
              <p className="text-xs text-[#64748b]">Adoption and pet care support</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-[#64748b] hover:bg-[#e2e8f0]"
              aria-label="Close chat assistant"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid h-[calc(100%-57px)] min-h-0 grid-cols-[120px_minmax(0,1fr)] sm:grid-cols-[140px_minmax(0,1fr)]">
            <div className="min-h-0 border-r border-[#e2e8f0] bg-[#fbfdff]">
              <div className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                Conversations
              </div>
              <div className="h-[calc(100%-34px)] space-y-1 overflow-y-auto px-2 pb-2">
                {conversations.map((conversation) => (
                  <button
                    key={conversation._id}
                    onClick={() => setActiveConversationId(conversation._id)}
                    className={`w-full rounded-lg px-2 py-2 text-left text-xs ${
                      activeConversationId === conversation._id
                        ? "bg-[#e2edff] text-[#1d4ed8]"
                        : "text-[#334155] hover:bg-[#eef2ff]"
                    }`}
                  >
                    <p className="truncate font-semibold">{conversation.title || "New Chat"}</p>
                    <p className="truncate text-[11px] opacity-70">
                      {conversation.lastMessage || "No messages"}
                    </p>
                  </button>
                ))}
                {conversations.length === 0 && !isLoading && (
                  <p className="px-2 py-2 text-xs text-[#94a3b8]">No chats yet</p>
                )}
              </div>
            </div>

            <div className="flex min-h-0 h-full flex-col">
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                {isLoading && <p className="text-xs text-[#64748b]">Loading...</p>}
                {!isLoading && messages.length === 0 && (
                  <p className="text-xs text-[#64748b]">
                    Ask about pet adoption, pet care, nutrition, training, or app workflows.
                  </p>
                )}

                {messages.map((message) => (
                  <div
                    key={message._id}
                    className={`max-w-[94%] rounded-xl px-3 py-2 text-sm break-words ${
                      message.role === "user"
                        ? "ml-auto bg-[#2f66ff] text-white"
                        : "bg-[#f1f5f9] text-[#0f172a]"
                    }`}
                  >
                    {message.content}
                  </div>
                ))}
              </div>

              {error && <p className="px-3 pb-1 text-xs text-[#dc2626]">{error}</p>}
              {remainingMessages !== null && (
                <p className="px-3 pb-1 text-[11px] text-[#64748b]">
                  Remaining today: {remainingMessages}
                </p>
              )}

              {queuedImages.length ? (
                <div className="px-3 pb-1 text-[11px] text-[#0f766e]">
                  {queuedImages.length} image{queuedImages.length > 1 ? "s" : ""} attached for analysis
                </div>
              ) : null}

              <div className="border-t border-[#e2e8f0] p-2">
                <div className="flex items-center gap-2">
                  <label className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#d5dfef] text-[#334155]">
                    <ImagePlus size={16} />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void onSend();
                      }
                    }}
                    placeholder="Ask PetAI Assistant..."
                    className="w-full rounded-lg border border-[#d5dfef] px-3 py-2 text-sm outline-none focus:border-[#2f66ff]"
                  />
                  <button
                    onClick={() => void onSend()}
                    disabled={isSending || (!draft.trim() && queuedImages.length === 0)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#2f66ff] text-white disabled:opacity-50"
                    aria-label="Send message"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const [, base64 = ""] = result.split(",");
      if (!base64) {
        reject(new Error("No file data"));
        return;
      }

      resolve(base64);
    };
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}
