import { useState } from "react";
import { User, ThumbsUp, TrashIcon, KeyboardIcon, Flag } from "lucide-react";

interface CommentAuthor {
  _id: string;
  fullName: string;
  profilePhoto?: string;
  role: string;
}

interface Comment {
  _id: string;
  content: string;
  author: CommentAuthor;
  likeCount: number;
  isLikedByUser?: boolean;
  createdAt: string;
  isEdited?: boolean;
  replies?: Comment[];
  replyCount?: number;
}

interface CommentsProps {
  comments: Comment[];
  currentUserId?: string;
  onAddComment: (content: string, parentCommentId?: string) => Promise<void>;
  onEditComment?: (commentId: string, content: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  onLikeComment?: (commentId: string) => Promise<void>;
  onReportComment?: (commentId: string, reason: string) => Promise<void>;
  isLoading?: boolean;
}

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onReply: (parentId: string) => void;
  onEdit?: (comment: Comment) => void;
  onDelete?: (commentId: string) => Promise<void>;
  onLike?: (commentId: string) => Promise<void>;
  onReport?: (commentId: string, reason: string) => Promise<void>;
  isReply?: boolean;
}

function CommentItem({
  comment,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onLike,
  onReport,
  isReply = false,
}: CommentItemProps) {
  const isAuthor = currentUserId === comment.author._id;
  const createdDate = new Date(comment.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className={`${isReply ? "ml-8" : ""} mb-4`}>
      <div className="bg-gray-50 rounded-lg p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              {comment.author.profilePhoto ? (
                <img
                  src={comment.author.profilePhoto}
                  alt={comment.author.fullName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-gray-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {comment.author.fullName}
              </p>
              <p className="text-xs text-gray-500">
                {createdDate}
                {comment.isEdited && " (edited)"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {isAuthor && (
              <>
                <button
                  onClick={() => onEdit?.(comment)}
                  className="p-1 text-gray-500 hover:bg-gray-200 rounded transition-colors"
                  title="Edit"
                >
                  <KeyboardIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete?.(comment._id)}
                  className="p-1 text-gray-500 hover:bg-red-100 hover:text-red-600 rounded transition-colors"
                  title="Delete"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </>
            )}
            {!isAuthor && (
              <button
                onClick={() => onReport?.(comment._id, "inappropriate")}
                className="p-1 text-gray-500 hover:bg-yellow-100 hover:text-yellow-600 rounded transition-colors"
                title="Report"
              >
                <Flag className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-gray-700 mb-3">{comment.content}</p>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onLike?.(comment._id)}
            className={`inline-flex items-center gap-1 text-xs transition-colors ${
              comment.isLikedByUser
                ? "text-red-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{comment.likeCount}</span>
          </button>

          {!isReply && (
            <button
              onClick={() => onReply(comment._id)}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Reply
            </button>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onLike={onLike}
              onReport={onReport}
              isReply={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Comments({
  comments,
  currentUserId,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onLikeComment,
  onReportComment,
  isLoading = false,
}: CommentsProps) {
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingComment) {
        await onEditComment?.(editingComment._id, commentText);
        setEditingComment(null);
      } else {
        await onAddComment(commentText, replyTo || undefined);
        setReplyTo(null);
      }
      setCommentText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6">
        Comments ({comments.length})
      </h3>

      {/* Add Comment Form */}
      {currentUserId && (
        <form onSubmit={handleSubmit} className="mb-8 pb-8 border-b">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-gray-600" />
            </div>

            <div className="flex-1">
              {replyTo && (
                <p className="text-xs text-gray-500 mb-2">
                  Replying to comment
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="text-gray-700 hover:text-gray-900 ml-1"
                  >
                    ✕
                  </button>
                </p>
              )}

              {editingComment && (
                <p className="text-xs text-gray-500 mb-2">
                  Editing comment
                  <button
                    type="button"
                    onClick={() => {
                      setEditingComment(null);
                      setCommentText("");
                    }}
                    className="text-gray-700 hover:text-gray-900 ml-1"
                  >
                    ✕
                  </button>
                </p>
              )}

              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a thoughtful comment..."
                rows={3}
                maxLength={2000}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />

              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-500">
                  {commentText.length}/2000 characters
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting || !commentText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {editingComment ? "Update" : "Comment"}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {!currentUserId && (
        <div className="mb-8 pb-8 border-b p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-sm text-gray-600">
            Please log in to leave a comment
          </p>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading comments...</p>
        </div>
      ) : comments.length > 0 ? (
        <div>
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              currentUserId={currentUserId}
              onReply={setReplyTo}
              onEdit={(c) => {
                setEditingComment(c);
                setCommentText(c.content);
              }}
              onDelete={onDeleteComment}
              onLike={onLikeComment}
              onReport={onReportComment}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
}
