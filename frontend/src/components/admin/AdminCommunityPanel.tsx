"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

type FlaggedPost = {
  _id: string;
  title: string;
  content: string;
  reportCount: number;
  author?: {
    fullName?: string;
    email?: string;
  };
};

type FlaggedComment = {
  _id: string;
  content: string;
  reportCount: number;
  author?: {
    fullName?: string;
    email?: string;
  };
  post?: {
    title?: string;
  };
};

type FlaggedModerationResult = {
  posts?: FlaggedPost[];
  comments?: FlaggedComment[];
};

type PendingStory = {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  author?: {
    fullName?: string;
    email?: string;
  };
};

type PendingStoriesResult = {
  posts?: PendingStory[];
};

export function AdminCommunityPanel() {
  const [pendingStories, setPendingStories] = useState<PendingStory[]>([]);
  const [posts, setPosts] = useState<FlaggedPost[]>([]);
  const [comments, setComments] = useState<FlaggedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState("");
  const [error, setError] = useState("");

  const loadFlaggedContent = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<FlaggedModerationResult>(
        "/community/moderation/flagged?type=all&limit=25",
        { auth: true }
      );

      setPosts(response.data?.posts ?? []);
      setComments(response.data?.comments ?? []);

      const pendingStoriesResponse = await apiRequest<PendingStoriesResult>(
        "/community/moderation/stories/pending?limit=25",
        { auth: true }
      );

      setPendingStories(pendingStoriesResponse.data?.posts ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load flagged content");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFlaggedContent();
  }, [loadFlaggedContent]);

  async function moderatePost(postId: string, action: "approve" | "dismiss") {
    setActingId(postId);
    setError("");

    try {
      await apiRequest(`/community/moderation/posts/${postId}`, {
        method: "POST",
        auth: true,
        body: { action },
      });
      await loadFlaggedContent();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to moderate post");
    } finally {
      setActingId("");
    }
  }

  async function moderateComment(commentId: string, action: "approve" | "dismiss") {
    setActingId(commentId);
    setError("");

    try {
      await apiRequest(`/community/moderation/comments/${commentId}`, {
        method: "POST",
        auth: true,
        body: { action },
      });
      await loadFlaggedContent();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to moderate comment");
    } finally {
      setActingId("");
    }
  }

  async function approvePendingStory(postId: string) {
    setActingId(postId);
    setError("");

    try {
      await apiRequest(`/community/posts/${postId}/approve`, {
        method: "POST",
        auth: true,
      });
      await loadFlaggedContent();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to approve success story");
    } finally {
      setActingId("");
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-[#d8deee] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">Community Moderation</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0f172a]">Flagged Content Queue</h2>
        <p className="mt-2 text-sm text-[#64748b]">
          Approve success stories for publication and moderate reported posts/comments.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-[#e8f9ef] px-3 py-1.5 font-semibold text-[#0f8b61]">
            Pending stories: {pendingStories.length}
          </span>
          <span className="rounded-full bg-[#f3f6fd] px-3 py-1.5 font-semibold text-[#214dbf]">
            Flagged posts: {posts.length}
          </span>
          <span className="rounded-full bg-[#f3f6fd] px-3 py-1.5 font-semibold text-[#214dbf]">
            Flagged comments: {comments.length}
          </span>
          <button
            type="button"
            onClick={() => void loadFlaggedContent()}
            className="rounded-full border border-[#d5dfef] bg-white px-4 py-1.5 font-semibold text-[#334155] hover:bg-[#f8fbff]"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#b91c1c]">
          {error}
        </div>
      ) : null}

      <article className="rounded-3xl border border-[#d8deee] bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-[#0f172a]">Pending Success Stories</h3>
        <div className="mt-4 space-y-3">
          {loading ? <p className="text-sm text-[#64748b]">Loading pending stories...</p> : null}
          {!loading && !pendingStories.length ? (
            <p className="rounded-2xl border border-dashed border-[#d5dfef] bg-[#fafcff] p-4 text-sm text-[#64748b]">
              No success stories waiting for approval.
            </p>
          ) : null}
          {pendingStories.map((story) => (
            <div key={story._id} className="rounded-2xl border border-[#d4f2df] bg-[#f7fffa] p-4">
              <p className="text-sm font-bold text-[#0f172a]">{story.title || "Untitled story"}</p>
              <p className="mt-1 line-clamp-3 text-sm text-[#475569]">{story.content || "No content"}</p>
              <p className="mt-2 text-xs text-[#64748b]">
                By {story.author?.fullName || "Unknown"} • {new Date(story.createdAt).toLocaleDateString()}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => void approvePendingStory(story._id)}
                  disabled={actingId === story._id}
                  className="rounded-full bg-[#16a34a] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  {actingId === story._id ? "Processing..." : "Approve Story"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </article>

      <div className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-3xl border border-[#d8deee] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-[#0f172a]">Flagged Posts</h3>
          <div className="mt-4 space-y-3">
            {loading ? <p className="text-sm text-[#64748b]">Loading flagged posts...</p> : null}
            {!loading && !posts.length ? (
              <p className="rounded-2xl border border-dashed border-[#d5dfef] bg-[#fafcff] p-4 text-sm text-[#64748b]">
                No flagged posts right now.
              </p>
            ) : null}
            {posts.map((post) => (
              <div key={post._id} className="rounded-2xl border border-[#e3ebfa] bg-[#fafcff] p-4">
                <p className="text-sm font-bold text-[#0f172a]">{post.title || "Untitled post"}</p>
                <p className="mt-1 line-clamp-3 text-sm text-[#475569]">{post.content || "No content"}</p>
                <p className="mt-2 text-xs text-[#64748b]">
                  By {post.author?.fullName || "Unknown"} • Reports: {post.reportCount ?? 0}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void moderatePost(post._id, "approve")}
                    disabled={actingId === post._id}
                    className="rounded-full bg-[#dc2626] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                  >
                    {actingId === post._id ? "Processing..." : "Remove Post"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void moderatePost(post._id, "dismiss")}
                    disabled={actingId === post._id}
                    className="rounded-full border border-[#d5dfef] bg-white px-4 py-2 text-xs font-bold text-[#334155] disabled:opacity-60"
                  >
                    Dismiss Reports
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-[#d8deee] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-[#0f172a]">Flagged Comments</h3>
          <div className="mt-4 space-y-3">
            {loading ? <p className="text-sm text-[#64748b]">Loading flagged comments...</p> : null}
            {!loading && !comments.length ? (
              <p className="rounded-2xl border border-dashed border-[#d5dfef] bg-[#fafcff] p-4 text-sm text-[#64748b]">
                No flagged comments right now.
              </p>
            ) : null}
            {comments.map((comment) => (
              <div key={comment._id} className="rounded-2xl border border-[#e3ebfa] bg-[#fafcff] p-4">
                <p className="text-sm text-[#0f172a]">{comment.content || "No comment content"}</p>
                <p className="mt-2 text-xs text-[#64748b]">
                  Post: {comment.post?.title || "Unknown post"} • Reports: {comment.reportCount ?? 0}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void moderateComment(comment._id, "approve")}
                    disabled={actingId === comment._id}
                    className="rounded-full bg-[#dc2626] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                  >
                    {actingId === comment._id ? "Processing..." : "Remove Comment"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void moderateComment(comment._id, "dismiss")}
                    disabled={actingId === comment._id}
                    className="rounded-full border border-[#d5dfef] bg-white px-4 py-2 text-xs font-bold text-[#334155] disabled:opacity-60"
                  >
                    Dismiss Reports
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
