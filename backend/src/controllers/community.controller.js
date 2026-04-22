const { z } = require("zod");
const {
  createPost,
  getFeed,
  getPost,
  updatePost,
  deletePost,
  likePost,
  reportPost,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  reportComment,
  getFlaggedContent,
  moderatePost,
  moderateComment,
  approveStoryPost,
  listPendingStoryPosts,
} = require("../services/community.service");
const Comment = require("../models/Comment");

// ==================== POST HANDLERS ====================

/**
 * Create a new post
 */
async function createPostHandler(req, res) {
  try {
    const postSchema = z.object({
      title: z.string().trim().min(5).max(200),
      content: z.string().trim().min(10).max(5000),
      category: z
        .enum([
          "general",
          "tips",
          "questions",
          "success-stories",
          "lost-found",
          "events",
          "other",
        ])
        .optional(),
      tags: z.array(z.string().trim()).max(5).optional(),
      images: z.array(z.string().url()).max(5).optional(),
    });

    const parsed = postSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0].message,
        code: 400,
      });
    }

    const post = await createPost(req.authUser._id, parsed.data);

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: { post },
    });
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating post",
      code: 500,
    });
  }
}

/**
 * Get community feed
 */
async function getFeedHandler(req, res) {
  try {
    const { page = 1, limit = 20, category = null, sortBy = "latest", search = "" } = req.query;
    const userId = req.authUser?._id || null;

    const feed = await getFeed({
      page: Number(page),
      limit: Math.min(50, Number(limit)),
      category,
      sortBy,
      searchQuery: search,
      userId,
    });

    return res.status(200).json({
      success: true,
      data: feed,
    });
  } catch (error) {
    console.error("Error fetching feed:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching feed",
      code: 500,
    });
  }
}

/**
 * Get single post with comments
 */
async function getPostHandler(req, res) {
  try {
    const { postId } = req.params;
    const userId = req.authUser?._id || null;

    const post = await getPost(postId, userId);

    return res.status(200).json({
      success: true,
      data: { post },
    });
  } catch (error) {
    console.error("Error fetching post:", error);

    if (error.message === "Post not found") {
      return res.status(404).json({
        success: false,
        message: "Post not found",
        code: 404,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error fetching post",
      code: 500,
    });
  }
}

/**
 * Update a post
 */
async function updatePostHandler(req, res) {
  try {
    const { postId } = req.params;
    const updateSchema = z.object({
      title: z.string().trim().min(5).max(200).optional(),
      content: z.string().trim().min(10).max(5000).optional(),
      category: z
        .enum([
          "general",
          "tips",
          "questions",
          "success-stories",
          "lost-found",
          "events",
          "other",
        ])
        .optional(),
      tags: z.array(z.string().trim()).max(5).optional(),
      images: z.array(z.string().url()).max(5).optional(),
    });

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0].message,
        code: 400,
      });
    }

    const post = await updatePost(postId, req.authUser._id, parsed.data);

    return res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: { post },
    });
  } catch (error) {
    console.error("Error updating post:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
        code: 404,
      });
    }

    if (error.message.includes("not authorized")) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this post",
        code: 403,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error updating post",
      code: 500,
    });
  }
}

/**
 * Delete a post
 */
async function deletePostHandler(req, res) {
  try {
    const { postId } = req.params;

    await deletePost(postId, req.authUser._id);

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
        code: 404,
      });
    }

    if (error.message.includes("not authorized")) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this post",
        code: 403,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error deleting post",
      code: 500,
    });
  }
}

/**
 * Like/Unlike a post
 */
async function togglePostLikeHandler(req, res) {
  try {
    const { postId } = req.params;

    const likeCount = await likePost(postId, req.authUser._id);

    return res.status(200).json({
      success: true,
      message: "Like toggled successfully",
      data: { likeCount },
    });
  } catch (error) {
    console.error("Error toggling post like:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
        code: 404,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error toggling like",
      code: 500,
    });
  }
}

/**
 * Report a post
 */
async function reportPostHandler(req, res) {
  try {
    const { postId } = req.params;
    const reportSchema = z.object({
      reason: z.enum([
        "inappropriate",
        "spam",
        "harassment",
        "misleading",
        "other",
      ]),
      details: z.string().max(500).optional(),
    });

    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0].message,
        code: 400,
      });
    }

    await reportPost(postId, req.authUser._id, parsed.data);

    return res.status(200).json({
      success: true,
      message: "Post reported successfully",
    });
  } catch (error) {
    console.error("Error reporting post:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
        code: 404,
      });
    }

    if (error.message.includes("already reported")) {
      return res.status(409).json({
        success: false,
        message: error.message,
        code: 409,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error reporting post",
      code: 500,
    });
  }
}

// ==================== COMMENT HANDLERS ====================

/**
 * Get comments for a post
 */
async function getPostCommentsHandler(req, res) {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.authUser?._id || null;

    const comments = await Comment.find({
      post: postId,
      parentComment: null,
      isDeleted: false,
    })
      .populate("author", "fullName profilePhoto role")
      .populate("likes", "_id")
      .sort({ likeCount: -1, createdAt: -1 })
      .skip((Math.max(1, Number(page)) - 1) * Math.min(100, Math.max(1, Number(limit))))
      .limit(Math.min(100, Math.max(1, Number(limit))))
      .lean();

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({
          post: postId,
          parentComment: comment._id,
          isDeleted: false,
        })
          .populate("author", "fullName profilePhoto role")
          .populate("likes", "_id")
          .sort({ createdAt: 1 })
          .lean();

        return {
          ...comment,
          replies: replies.map((reply) => ({
            ...reply,
            isLikedByUser: userId ? reply.likes.some((like) => like._id.toString() === userId.toString()) : false,
          })),
          isLikedByUser: userId ? comment.likes.some((like) => like._id.toString() === userId.toString()) : false,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: commentsWithReplies,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching comments",
      code: 500,
    });
  }
}

/**
 * Create a comment
 */
async function createCommentHandler(req, res) {
  try {
    const { postId } = req.params;
    const commentSchema = z.object({
      content: z.string().trim().min(1).max(2000),
      parentComment: z.string().optional(),
    });

    const parsed = commentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0].message,
        code: 400,
      });
    }

    const comment = await createComment(postId, req.authUser._id, parsed.data);

    return res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: { comment },
    });
  } catch (error) {
    console.error("Error creating comment:", error);

    if (error.message.includes("not found") || error.message.includes("locked")) {
      return res.status(400).json({
        success: false,
        message: error.message,
        code: 400,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error creating comment",
      code: 500,
    });
  }
}

/**
 * Update a comment
 */
async function updateCommentHandler(req, res) {
  try {
    const { commentId } = req.params;
    const updateSchema = z.object({
      content: z.string().trim().min(1).max(2000),
    });

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0].message,
        code: 400,
      });
    }

    const comment = await updateComment(commentId, req.authUser._id, parsed.data);

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: { comment },
    });
  } catch (error) {
    console.error("Error updating comment:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
        code: 404,
      });
    }

    if (error.message.includes("not authorized")) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this comment",
        code: 403,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error updating comment",
      code: 500,
    });
  }
}

/**
 * Delete a comment
 */
async function deleteCommentHandler(req, res) {
  try {
    const { commentId } = req.params;

    await deleteComment(commentId, req.authUser._id);

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
        code: 404,
      });
    }

    if (error.message.includes("not authorized")) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment",
        code: 403,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error deleting comment",
      code: 500,
    });
  }
}

/**
 * Like/Unlike a comment
 */
async function toggleCommentLikeHandler(req, res) {
  try {
    const { commentId } = req.params;

    const likeCount = await likeComment(commentId, req.authUser._id);

    return res.status(200).json({
      success: true,
      message: "Like toggled successfully",
      data: { likeCount },
    });
  } catch (error) {
    console.error("Error toggling comment like:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
        code: 404,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error toggling like",
      code: 500,
    });
  }
}

/**
 * Report a comment
 */
async function reportCommentHandler(req, res) {
  try {
    const { commentId } = req.params;
    const reportSchema = z.object({
      reason: z.enum([
        "inappropriate",
        "spam",
        "harassment",
        "misleading",
        "other",
      ]),
      details: z.string().max(500).optional(),
    });

    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0].message,
        code: 400,
      });
    }

    await reportComment(commentId, req.authUser._id, parsed.data);

    return res.status(200).json({
      success: true,
      message: "Comment reported successfully",
    });
  } catch (error) {
    console.error("Error reporting comment:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
        code: 404,
      });
    }

    if (error.message.includes("already reported")) {
      return res.status(409).json({
        success: false,
        message: error.message,
        code: 409,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error reporting comment",
      code: 500,
    });
  }
}

// ==================== MODERATION HANDLERS ====================

/**
 * Get flagged content (admin only)
 */
async function getFlaggedContentHandler(req, res) {
  try {
    const { page = 1, limit = 20, type = "all" } = req.query;

    const flagged = await getFlaggedContent({
      page: Number(page),
      limit: Math.min(50, Number(limit)),
      type,
    });

    return res.status(200).json({
      success: true,
      data: flagged,
    });
  } catch (error) {
    console.error("Error fetching flagged content:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching flagged content",
      code: 500,
    });
  }
}

/**
 * Moderate a post (admin only)
 */
async function moderatePostHandler(req, res) {
  try {
    const { postId } = req.params;
    const { action } = req.body;

    if (!["approve", "dismiss"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be 'approve' or 'dismiss'",
        code: 400,
      });
    }

    await moderatePost(postId, action);

    return res.status(200).json({
      success: true,
      message: `Post moderation action '${action}' completed`,
    });
  } catch (error) {
    console.error("Error moderating post:", error);
    return res.status(500).json({
      success: false,
      message: "Error moderating post",
      code: 500,
    });
  }
}

/**
 * Moderate a comment (admin only)
 */
async function moderateCommentHandler(req, res) {
  try {
    const { commentId } = req.params;
    const { action } = req.body;

    if (!["approve", "dismiss"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be 'approve' or 'dismiss'",
        code: 400,
      });
    }

    await moderateComment(commentId, action);

    return res.status(200).json({
      success: true,
      message: `Comment moderation action '${action}' completed`,
    });
  } catch (error) {
    console.error("Error moderating comment:", error);
    return res.status(500).json({
      success: false,
      message: "Error moderating comment",
      code: 500,
    });
  }
}

/**
 * Approve a success story post (admin only)
 */
async function approveStoryPostHandler(req, res) {
  try {
    const { postId } = req.params;

    const post = await approveStoryPost(postId, req.authUser._id);

    return res.status(200).json({
      success: true,
      message: "Success story approved successfully",
      data: { post },
    });
  } catch (error) {
    console.error("Error approving success story:", error);

    if (error.message === "Post not found") {
      return res.status(404).json({
        success: false,
        message: "Post not found",
        code: 404,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error approving success story",
      code: 500,
    });
  }
}

async function listPendingStoryPostsHandler(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;

    const result = await listPendingStoryPosts({
      page: Number(page),
      limit: Number(limit),
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching pending success stories:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching pending success stories",
      code: 500,
    });
  }
}

module.exports = {
  // Post handlers
  createPostHandler,
  getFeedHandler,
  getPostHandler,
  updatePostHandler,
  deletePostHandler,
  togglePostLikeHandler,
  reportPostHandler,

  // Comment handlers
    getPostCommentsHandler,
  createCommentHandler,
  updateCommentHandler,
  deleteCommentHandler,
  toggleCommentLikeHandler,
  reportCommentHandler,

  // Moderation handlers
  getFlaggedContentHandler,
  moderatePostHandler,
  moderateCommentHandler,
  approveStoryPostHandler,
  listPendingStoryPostsHandler,
};
