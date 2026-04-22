import { User, MessageCircle, ThumbsUp, Flag, Trash2, Edit, Share2 } from "lucide-react";

interface Post {
  _id: string;
  author: {
    _id: string;
    fullName: string;
    profilePhoto?: string;
    role: string;
  };
  title: string;
  content: string;
  category: string;
  tags: string[];
  likeCount: number;
  commentCount: number;
  viewCount: number;
  isFeatured: boolean;
  isPinned: boolean;
  createdAt: string;
  isLikedByUser?: boolean;
  images?: string[];
}

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onComment: (postId: string) => void;
  onLike?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onReport?: (postId: string) => void;
}

export default function PostCard({
  post,
  currentUserId,
  onComment,
  onLike,
  onShare,
  onEdit,
  onDelete,
  onReport,
}: PostCardProps) {
  const isAuthor = currentUserId === post.author._id;
  const createdDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      general: "bg-blue-100 text-blue-700",
      tips: "bg-green-100 text-green-700",
      questions: "bg-yellow-100 text-yellow-700",
      "success-stories": "bg-purple-100 text-purple-700",
      "lost-found": "bg-red-100 text-red-700",
      events: "bg-indigo-100 text-indigo-700",
      other: "bg-gray-100 text-gray-700",
    };
    return colors[category] || colors.general;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            {post.author.profilePhoto ? (
              <img
                src={post.author.profilePhoto}
                alt={post.author.fullName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-gray-600" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{post.author.fullName}</p>
            <p className="text-xs text-gray-500">{createdDate}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isAuthor && (
            <>
              <button
                onClick={() => onEdit?.(post._id)}
                className="p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                title="Edit post"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete?.(post._id)}
                className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                title="Delete post"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          {!isAuthor && (
            <button
              onClick={() => onReport?.(post._id)}
              className="p-2 text-gray-500 hover:bg-yellow-50 hover:text-yellow-600 rounded-lg transition-colors"
              title="Report post"
            >
              <Flag className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryBadgeColor(post.category)}`}>
          {post.category}
        </span>
        {post.isPinned && (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
            📌 Pinned
          </span>
        )}
        {post.isFeatured && (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
            ⭐ Featured
          </span>
        )}
      </div>

      {/* Title and Content */}
      <div
        onClick={() => onComment(post._id)}
        className="cursor-pointer mb-4 group"
      >
        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
          {post.title}
        </h3>
        <p className="text-gray-600 line-clamp-3">{post.content}</p>
      </div>

      {post.images && post.images.length > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-2">
          {post.images.slice(0, 3).map((image, index) => (
            <img
              key={`${post._id}-image-${index}`}
              src={image}
              alt={`Post image ${index + 1}`}
              className="h-28 w-full rounded-lg border border-gray-200 object-cover"
            />
          ))}
        </div>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Stats and Actions */}
      <div className="border-t pt-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{post.viewCount} views</span>
          <span>{post.commentCount} comments</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onLike?.(post._id)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              post.isLikedByUser
                ? "bg-red-100 text-red-600"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span className="text-sm font-medium">{post.likeCount}</span>
          </button>

          <button
            onClick={() => onComment(post._id)}
            className="inline-flex items-center gap-2 px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{post.commentCount}</span>
          </button>

          <button
            onClick={() => onShare?.(post._id)}
            className="inline-flex items-center gap-2 px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}
