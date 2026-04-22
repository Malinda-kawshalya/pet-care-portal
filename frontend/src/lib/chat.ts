import { apiRequest } from "@/lib/api";

export type ChatConversation = {
  _id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
};

export type ChatMessage = {
  _id: string;
  conversation: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

export type ChatImageInput = {
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  dataBase64: string;
};

export async function fetchConversations() {
  const response = await apiRequest<{ conversations: ChatConversation[] }>(
    "/chat/conversations",
    { auth: true }
  );

  return response.data?.conversations || [];
}

export async function fetchConversationMessages(conversationId: string) {
  const response = await apiRequest<{
    conversation: ChatConversation;
    messages: ChatMessage[];
  }>(`/chat/conversations/${conversationId}/messages`, {
    auth: true,
  });

  return {
    conversation: response.data?.conversation || null,
    messages: response.data?.messages || [],
  };
}

export async function sendChatMessage(
  message: string,
  conversationId?: string,
  images: ChatImageInput[] = []
) {
  const response = await apiRequest<{
    conversation: ChatConversation;
    message: ChatMessage;
    reply: string;
    remainingMessages: number;
    dailyLimit: number;
  }>("/chat/message", {
    method: "POST",
    auth: true,
    body: {
      message,
      conversationId,
      images,
    },
  });

  return response.data;
}
