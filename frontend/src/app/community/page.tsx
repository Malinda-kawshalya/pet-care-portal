"use client";

import { useEffect, useState } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import PostCard from "@/components/community/PostCard";
import Comments from "@/components/community/Comments";
import CreatePostForm, { type CreatePostData } from "@/components/community/CreatePostForm";
import { apiClient } from "@/lib/api";
import { fetchCurrentUser } from "@/lib/auth";
import { getAuthState } from "@/lib/auth-storage";
import { io, type Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { Search, Filter, X } from "lucide-react";

interface Post {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    fullName: string;
    profilePhoto?: string;
    role: string;
    expertise?: string[];
  };
  category:
    | "general"
    | "tips"
    | "questions"
    | "success-stories"
    | "lost-found"
    | "events"
    | "other";
  tags: string[];
  likeCount: number;
  isLikedByUser?: boolean;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  isFeatured: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  isEdited?: boolean;
  attachments?: Array<{
    type: "image" | "video" | "document";
    url: string;
    title?: string;
  }>;
  images?: string[];
}

interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    fullName: string;
    profilePhoto?: string;
    role: string;
  };
  likeCount: number;
  isLikedByUser?: boolean;
  createdAt: string;
  isEdited?: boolean;
  replies?: Comment[];
  replyCount?: number;
}

interface CommunityChatMessage {
  id: string;
  content: string;
  room: string;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    profilePhoto?: string;
    role: string;
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "response" in error) {
    const maybeResponse = (error as { response?: { data?: { message?: string } } }).response;
    if (maybeResponse?.data?.message) {
      return maybeResponse.data.message;
    }
  }
  return fallback;
}

export default function CommunityPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postComments, setPostComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [communityMessages, setCommunityMessages] = useState<CommunityChatMessage[]>([]);
  const [communityDraft, setCommunityDraft] = useState("");
  const [communityLoading, setCommunityLoading] = useState(true);
  const [communitySending, setCommunitySending] = useState(false);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [communitySocket, setCommunitySocket] = useState<Socket | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  useEffect(() => {
    const authState = getAuthState();
    if (!authState?.token) {
      router.replace("/login?redirect=%2Fcommunity");
    }
  }, [router]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await fetchCurrentUser();
        setCurrentUserId(user.id);
      } catch {
        setCurrentUserId(null);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    let active = true;

    const fetchCommunityMessages = async () => {
      try {
        setCommunityLoading(true);
        const response = await apiClient.get("/api/v1/community/chat/messages", { auth: true });
        if (!active) {
          return;
        }

        setCommunityMessages(response.data?.data?.messages || []);
        setCommunityError(null);
      } catch (err: unknown) {
        if (active) {
          setCommunityError(getErrorMessage(err, "Failed to load community chat"));
        }
      } finally {
        if (active) {
          setCommunityLoading(false);
        }
      }
    };

    const authState = getAuthState();
    const token = authState?.token;

    if (!token) {
      void fetchCommunityMessages();
      return () => {
        active = false;
      };
    }

    const socketBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1").replace(
      /\/api\/v1\/?$/,
      ""
    );

    const socket = io(socketBase, {
      transports: ["websocket"],
      auth: { token },
    });

    setCommunitySocket(socket);

    socket.on("connect", () => {
      socket.emit("community:join");
    });

    socket.on("community:new-message", (incoming: CommunityChatMessage) => {
      setCommunityMessages((previous) => {
        if (previous.some((message) => message.id === incoming.id)) {
          return previous;
        }

        return [...previous, incoming];
      });
    });

    socket.on("connect_error", () => {
      setCommunityError("Real-time chat unavailable. Reconnecting...");
    });

    void fetchCommunityMessages();

    return () => {
      active = false;
      socket.disconnect();
      setCommunitySocket(null);
    };
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        let url = "/api/v1/community/posts";
        const params = new URLSearchParams();

        if (searchQuery) params.append("search", searchQuery);
        if (selectedCategory !== "all") params.append("category", selectedCategory);
        if (params.toString()) url += `?${params.toString()}`;

        const response = await apiClient.get(url, { auth: true });
        setPosts(response.data?.data?.posts || []);
        setError(null);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to load community posts"));
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchPosts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    if (!selectedPost) return;

    const fetchComments = async () => {
      try {
        setIsCommentsLoading(true);
        const response = await apiClient.get(`/api/v1/community/posts/${selectedPost._id}/comments`, {
          auth: true,
        });
        setPostComments(response.data?.data || []);
      } catch {
        setPostComments([]);
      } finally {
        setIsCommentsLoading(false);
      }
    };

    fetchComments();
  }, [selectedPost]);

  const handleLikePost = async (postId: string) => {
    try {
      await apiClient.post(`/api/v1/community/posts/${postId}/like`, undefined, { auth: true });

      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? {
                ...p,
                likeCount: p.isLikedByUser ? p.likeCount - 1 : p.likeCount + 1,
                isLikedByUser: !p.isLikedByUser,
              }
            : p
        )
      );

      setSelectedPost((prev) =>
        prev && prev._id === postId
          ? {
              ...prev,
              likeCount: prev.isLikedByUser ? prev.likeCount - 1 : prev.likeCount + 1,
              isLikedByUser: !prev.isLikedByUser,
            }
          : prev
      );
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Failed to like post"));
    }
  };

  const handleSharePost = async (postId: string) => {
    try {
      await apiClient.post(`/api/v1/community/posts/${postId}/share`, undefined, { auth: true });
      const postUrl = `${window.location.origin}/community?post=${postId}`;

      if (navigator.share) {
        await navigator.share({ title: "Check out this community post!", url: postUrl });
      } else {
        await navigator.clipboard.writeText(postUrl);
        alert("Link copied to clipboard!");
      }
    } catch {
      // Ignore share failures in UI for now.
    }
  };

  const handleCommentClick = (postId: string) => {
    const post = posts.find((p) => p._id === postId);
    if (post) setSelectedPost(post);
  };

  const handleAddComment = async (content: string, parentCommentId?: string) => {
    if (!selectedPost) return;

    const response = await apiClient.post(
      `/api/v1/community/posts/${selectedPost._id}/comments`,
      {
        content,
        parentComment: parentCommentId,
      },
      { auth: true }
    );

    const newComment: Comment = response.data?.data?.comment;

    if (!newComment) {
      throw new Error("Failed to add comment");
    }

    if (parentCommentId) {
      setPostComments((prev) =>
        prev.map((c) =>
          c._id === parentCommentId
            ? {
                ...c,
                replies: [...(c.replies || []), newComment],
                replyCount: (c.replyCount || 0) + 1,
              }
            : c
        )
      );
    } else {
      setPostComments((prev) => [newComment, ...prev]);
    }

    setPosts((prev) =>
      prev.map((p) =>
        p._id === selectedPost._id ? { ...p, commentCount: p.commentCount + 1 } : p
      )
    );

    setSelectedPost((prev) =>
      prev ? { ...prev, commentCount: prev.commentCount + 1 } : null
    );
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedPost) return;

    try {
      await apiClient.delete(`/api/v1/community/comments/${commentId}`, { auth: true });
      setPostComments((prev) => prev.filter((c) => c._id !== commentId));

      setPosts((prev) =>
        prev.map((p) =>
          p._id === selectedPost._id
            ? { ...p, commentCount: Math.max(p.commentCount - 1, 0) }
            : p
        )
      );

      setSelectedPost((prev) =>
        prev ? { ...prev, commentCount: Math.max(prev.commentCount - 1, 0) } : null
      );
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Failed to delete comment"));
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await apiClient.post(`/api/v1/community/comments/${commentId}/like`, undefined, { auth: true });
      setPostComments((prev) =>
        prev.map((c) =>
          c._id === commentId
            ? {
                ...c,
                likeCount: c.isLikedByUser ? c.likeCount - 1 : c.likeCount + 1,
                isLikedByUser: !c.isLikedByUser,
              }
            : c
        )
      );
    } catch {
      // Ignore optimistic-like mismatch for now.
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await apiClient.delete(`/api/v1/community/posts/${postId}`, { auth: true });
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      if (selectedPost?._id === postId) setSelectedPost(null);
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Failed to delete post"));
    }
  };

  const handleSendCommunityMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = communityDraft.trim();
    if (!trimmed) {
      return;
    }

    try {
      setCommunitySending(true);
      const response = await apiClient.post(
        "/api/v1/community/chat/messages",
        { content: trimmed },
        { auth: true }
      );

      const message = response.data?.data?.message as CommunityChatMessage | undefined;
      if (message) {
        setCommunityMessages((previous) => [...previous, message]);
      }

      communitySocket?.emit("community:join");
      setCommunityDraft("");
      setCommunityError(null);
    } catch (err: unknown) {
      setCommunityError(getErrorMessage(err, "Failed to send community message"));
    } finally {
      setCommunitySending(false);
    }
  };

  const handleCreatePost = async (data: CreatePostData) => {
    try {
      setIsCreatingPost(true);
      const response = await apiClient.post<{ post: Post }>(
        "/api/v1/community/posts",
        data,
        { auth: true }
      );

      const newPost = response.data?.data?.post;
      if (!newPost) {
        throw new Error("Failed to create post");
      }

      setPosts((prev) => [newPost, ...prev]);
      setSelectedPost(newPost);
    } finally {
      setIsCreatingPost(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fe]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-[#0f172a]">Community</h1>
            <p className="mt-2 text-[#475569]">
              Share stories, ask questions, and connect with other pet lovers
            </p>
          </div>
          <div className="hidden gap-3 md:flex">
            <a
              href="/success-stories"
              className="rounded-full border border-[#dbe4f4] bg-white px-4 py-2 text-sm font-semibold text-[#0f172a] transition hover:border-[#f97316] hover:text-[#f97316]"
            >
              Success Stories
            </a>
            <a
              href="/adoption-faq"
              className="rounded-full border border-[#dbe4f4] bg-white px-4 py-2 text-sm font-semibold text-[#0f172a] transition hover:border-[#f97316] hover:text-[#f97316]"
            >
              Adoption FAQ
            </a>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-[#f3d5a9] bg-[#fff8ee] p-4 text-sm text-[#92400e]">
          Looking for real adoption journeys? Visit the <a href="/success-stories" className="font-semibold underline">success stories page</a> or check the <a href="/adoption-faq" className="font-semibold underline">adoption FAQ</a> before you post.
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <CreatePostForm onSubmit={handleCreatePost} isLoading={isCreatingPost} />

            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Filter className="w-5 h-5 text-gray-600 flex-shrink-0" />
                {[
                  "all",
                  "general",
                  "tips",
                  "questions",
                  "success-stories",
                  "lost-found",
                  "events",
                  "other",
                ].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                      selectedCategory === cat
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {cat === "all"
                      ? "All"
                      : cat
                          .split("-")
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ")}
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading posts...</p>
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-[#0f172a]">Recent Posts</h2>
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    currentUserId={currentUserId || undefined}
                    onLike={handleLikePost}
                    onShare={handleSharePost}
                    onComment={handleCommentClick}
                    onDelete={handleDeletePost}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500">No posts found. Be the first to create one!</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-lg border border-[#dbe4f4] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Live group chat</h2>
                  <p className="text-sm text-gray-500">Chat with the community in real time</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Live
                </span>
              </div>

              {communityError ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {communityError}
                </div>
              ) : null}

              <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {communityLoading ? (
                  <p className="text-sm text-gray-500">Loading chat messages...</p>
                ) : communityMessages.length ? (
                  communityMessages.map((message) => (
                    <article
                      key={message.id}
                      className={`rounded-2xl border p-3 ${
                        message.author.id === currentUserId
                          ? "ml-8 border-blue-200 bg-blue-50"
                          : "mr-8 border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-gray-900">{message.author.fullName}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-gray-700">{message.content}</p>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No chat messages yet. Start the conversation.</p>
                )}
              </div>

              <form onSubmit={handleSendCommunityMessage} className="mt-4 space-y-3">
                <textarea
                  value={communityDraft}
                  onChange={(e) => setCommunityDraft(e.target.value)}
                  rows={3}
                  placeholder="Write a message to the community..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={communitySending || !communityDraft.trim()}
                  className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {communitySending ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>

            {selectedPost ? (
              <div className="sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Comments</h2>
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <Comments
                  comments={postComments}
                  currentUserId={currentUserId || undefined}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                  onLikeComment={handleLikeComment}
                  isLoading={isCommentsLoading}
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <p className="text-gray-500">Click on a post to view and add comments</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}