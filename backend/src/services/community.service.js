const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const { transformImageUrl } = require("./cloudinary.service");

// ==================== POST SERVICES ====================

/**
 * Create a new post
 * @param {string} authorId - User ID of post author
 * @param {object} postData - Post content (title, content, category, tags)
 * @returns {Promise<object>} - Created Post document
 */
async function createPost(authorId, postData = {}) {
  try {
    const approvalStatus = postData.category === "success-stories" ? "pending_approval" : "approved";

    const post = await Post.create({
      author: authorId,
      title: postData.title,
      content: postData.content,
      category: postData.category || "general",
      approvalStatus,
      tags: postData.tags || [],
      images: postData.images || [],
    });

    // Populate author details
    await post.populate("author", "fullName profilePhoto role");
    return post;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
}

/**
 * Get feed posts with pagination, filtering, and sorting
 * @param {object} options - Filter options
 * @returns {Promise<object>} - Posts and pagination metadata
 */
async function getFeed(options = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      category = null,
      sortBy = "latest", // latest, trending, featured
      searchQuery = "",
      userId = null,
    } = options;

    const skip = (page - 1) * limit;
    const query = { isDeleted: false, approvalStatus: "approved" };

    if (category) {
      query.category = category;
    }

    // Search query
    if (searchQuery) {
      query.$or = [
        { title: { $regex: searchQuery, $options: "i" } },
        { content: { $regex: searchQuery, $options: "i" } },
        { tags: { $in: [new RegExp(searchQuery, "i")] } },
      ];
    }

    // Determine sort order
    let sortOrder = { createdAt: -1 };
    if (sortBy === "trending") {
      sortOrder = { likeCount: -1, commentCount: -1, createdAt: -1 };
    } else if (sortBy === "featured") {
      sortOrder = { isPinned: -1, isFeatured: -1, createdAt: -1 };
    }

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate("author", "fullName profilePhoto role")
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(query),
    ]);

    return {
      posts: posts.map((post) => {
        const formatted = formatPost(post);
        const postLikes = Array.isArray(post.likes) ? post.likes : [];
        const isLikedByUser = userId
          ? postLikes.some((like) => like?.toString?.() === userId.toString())
          : false;

        return {
          ...formatted,
          isLikedByUser,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching feed:", error);
    throw error;
  }
}

/**
 * Get a single post by ID with comments
 * @param {string} postId - Post ID
 * @param {string} userId - Optional: current user ID for like check
 * @returns {Promise<object>} - Post with populated author and comments
 */
async function getPost(postId, userId = null) {
  try {
    // Increment view count
    await Post.findByIdAndUpdate(postId, { $inc: { viewCount: 1 } });

    const post = await Post.findById(postId)
      .populate("author", "fullName profilePhoto role")
      .populate("likes", "fullName");

    if (!post || post.isDeleted) {
      throw new Error("Post not found");
    }

    if (post.approvalStatus !== "approved") {
      const User = require("../models/User");
      const authorIdString = post.author?._id?.toString?.() || post.author?.toString?.() || "";
      const moderator = userId ? await User.findById(userId).select("role") : null;
      const canViewUnapproved =
        userId && (authorIdString === userId.toString() || moderator?.role === "super_admin" || moderator?.role === "veterinarian");

      if (!canViewUnapproved) {
        throw new Error("Post not found");
      }
    }

    // Get comments
    const comments = await Comment.find({
      post: postId,
      parentComment: null,
      isDeleted: false,
    })
      .populate("author", "fullName profilePhoto role")
      .populate("likes", "_id")
      .sort({ likeCount: -1, createdAt: -1 })
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
            isLikedByUser: userId ? reply.likes.some((like) => like._id.toString() === userId) : false,
          })),
          isLikedByUser: userId ? comment.likes.some((like) => like._id.toString() === userId) : false,
        };
      })
    );

    return {
      ...formatPost(post.toObject()),
      comments: commentsWithReplies,
      isLikedByUser: userId
        ? post.likes.some((like) => like._id.toString() === userId)
        : false,
    };
  } catch (error) {
    console.error("Error fetching post:", error);
    throw error;
  }
}

/**
 * Update a post (only author or moderator)
 * @param {string} postId - Post ID
 * @param {string} userId - User ID (must be author or admin)
 * @param {object} updateData - Fields to update
 * @returns {Promise<object>} - Updated post
 */
async function updatePost(postId, userId, updateData = {}) {
  try {
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Only author or admin can update
    if (
      post.author.toString() !== userId &&
      !(await isUserModerator(userId))
    ) {
      throw new Error("Not authorized to update this post");
    }

    const allowedFields = ["title", "content", "category", "tags", "images"];
    const updateObj = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updateObj[field] = updateData[field];
      }
    }

    const updated = await Post.findByIdAndUpdate(postId, updateObj, {
      new: true,
    }).populate("author", "fullName profilePhoto role");

    return formatPost(updated);
  } catch (error) {
    console.error("Error updating post:", error);
    throw error;
  }
}

/**
 * Delete a post (soft delete)
 * @param {string} postId - Post ID
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
async function deletePost(postId, userId) {
  try {
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Only author or admin can delete
    if (
      post.author.toString() !== userId &&
      !(await isUserModerator(userId))
    ) {
      throw new Error("Not authorized to delete this post");
    }

    await Post.findByIdAndUpdate(postId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId,
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
}

/**
 * Like a post
 * @param {string} postId - Post ID
 * @param {string} userId - User ID
 * @returns {Promise<number>} - New like count
 */
async function likePost(postId, userId) {
  try {
    const post = await Post.findById(postId);
    if (!post || post.isDeleted) {
      throw new Error("Post not found");
    }

    const alreadyLiked = post.likes.some((like) => like.toString() === userId.toString());

    if (alreadyLiked) {
      await Post.findByIdAndUpdate(postId, {
        $pull: { likes: userId },
        $inc: { likeCount: -1 },
      });
      return post.likeCount - 1;
    } else {
      await Post.findByIdAndUpdate(postId, {
        $push: { likes: userId },
        $inc: { likeCount: 1 },
      });
      return post.likeCount + 1;
    }
  } catch (error) {
    console.error("Error liking post:", error);
    throw error;
  }
}

/**
 * Report a post
 * @param {string} postId - Post ID
 * @param {string} userId - User ID
 * @param {object} reportData - Reason and details
 * @returns {Promise<void>}
 */
async function reportPost(postId, userId, reportData = {}) {
  try {
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Check if already reported by this user
    const alreadyReported = post.reports.some(
      (r) => r.reportedBy.toString() === userId
    );

    if (alreadyReported) {
      throw new Error("You have already reported this post");
    }

    const report = {
      reportedBy: userId,
      reason: reportData.reason || "other",
      details: reportData.details,
      reportedAt: new Date(),
    };

    await Post.findByIdAndUpdate(postId, {
      $push: { reports: report },
      $inc: { reportCount: 1 },
    });

    // Notify admins if report count exceeds threshold
    if (post.reportCount + 1 >= 3) {
      const User = require("../models/User");
      const admins = await User.find({ role: "super_admin" }).select("_id");

      for (const admin of admins) {
        await Notification.create({
          recipient: admin._id,
          type: "post-reported",
          title: "Post flagged for review",
          message: `Post "${post.title}" has been reported ${post.reportCount + 1} times`,
          entityType: "Post",
          entityId: postId,
        });
      }
    }
  } catch (error) {
    console.error("Error reporting post:", error);
    throw error;
  }
}

// ==================== COMMENT SERVICES ====================

/**
 * Create a comment on a post
 * @param {string} postId - Post ID
 * @param {string} authorId - User ID
 * @param {object} commentData - Comment content and parentComment
 * @returns {Promise<object>} - Created comment
 */
async function createComment(postId, authorId, commentData = {}) {
  try {
    const post = await Post.findById(postId);
    if (!post || post.isDeleted) {
      throw new Error("Post not found or locked");
    }

    if (post.isLocked) {
      throw new Error("Post is locked for comments");
    }

    const comment = await Comment.create({
      post: postId,
      author: authorId,
      content: commentData.content,
      parentComment: commentData.parentComment || null,
    });

    // Increment post comment count
    await Post.findByIdAndUpdate(postId, {
      $inc: { commentCount: 1 },
    });

    // If reply, increment parent reply count
    if (commentData.parentComment) {
      await Comment.findByIdAndUpdate(commentData.parentComment, {
        $inc: { replyCount: 1 },
      });
    }

    // Notify post author
    if (!commentData.parentComment) {
      const User = require("../models/User");
      const author = await User.findById(post.author);

      if (author && author._id.toString() !== authorId) {
        await Notification.create({
          recipient: post.author,
          type: "post-comment",
          title: `New comment on your post: "${post.title}"`,
          message: `${author.fullName} commented on your post`,
          entityType: "Post",
          entityId: postId,
          relatedData: { commentId: comment._id },
        });
      }
    }

    // Populate author
    await comment.populate("author", "fullName profilePhoto role");
    return comment;
  } catch (error) {
    console.error("Error creating comment:", error);
    throw error;
  }
}

/**
 * Update a comment
 * @param {string} commentId - Comment ID
 * @param {string} userId - User ID
 * @param {object} updateData - Updated content
 * @returns {Promise<object>} - Updated comment
 */
async function updateComment(commentId, userId, updateData = {}) {
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Only author or admin can update
    if (
      comment.author.toString() !== userId &&
      !(await isUserModerator(userId))
    ) {
      throw new Error("Not authorized to update this comment");
    }

    const updated = await Comment.findByIdAndUpdate(
      commentId,
      {
        content: updateData.content,
        isEdited: true,
        editedAt: new Date(),
      },
      { new: true }
    ).populate("author", "fullName profilePhoto role");

    return updated;
  } catch (error) {
    console.error("Error updating comment:", error);
    throw error;
  }
}

/**
 * Delete a comment (soft delete)
 * @param {string} commentId - Comment ID
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
async function deleteComment(commentId, userId) {
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Only author or admin can delete
    if (
      comment.author.toString() !== userId &&
      !(await isUserModerator(userId))
    ) {
      throw new Error("Not authorized to delete this comment");
    }

    await Comment.findByIdAndUpdate(commentId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId,
    });

    // Decrement post comment count
    await Post.findByIdAndUpdate(comment.post, {
      $inc: { commentCount: -1 },
    });

    // If reply, decrement parent reply count
    if (comment.parentComment) {
      await Comment.findByIdAndUpdate(comment.parentComment, {
        $inc: { replyCount: -1 },
      });
    }
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
}

/**
 * Like a comment
 * @param {string} commentId - Comment ID
 * @param {string} userId - User ID
 * @returns {Promise<number>} - New like count
 */
async function likeComment(commentId, userId) {
  try {
    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted) {
      throw new Error("Comment not found");
    }

    const alreadyLiked = comment.likes.some((like) => like.toString() === userId.toString());

    if (alreadyLiked) {
      await Comment.findByIdAndUpdate(commentId, {
        $pull: { likes: userId },
        $inc: { likeCount: -1 },
      });
      return comment.likeCount - 1;
    } else {
      await Comment.findByIdAndUpdate(commentId, {
        $push: { likes: userId },
        $inc: { likeCount: 1 },
      });
      return comment.likeCount + 1;
    }
  } catch (error) {
    console.error("Error liking comment:", error);
    throw error;
  }
}

/**
 * Report a comment
 * @param {string} commentId - Comment ID
 * @param {string} userId - User ID
 * @param {object} reportData - Reason and details
 * @returns {Promise<void>}
 */
async function reportComment(commentId, userId, reportData = {}) {
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Check if already reported by this user
    const alreadyReported = comment.reports.some(
      (r) => r.reportedBy.toString() === userId
    );

    if (alreadyReported) {
      throw new Error("You have already reported this comment");
    }

    const report = {
      reportedBy: userId,
      reason: reportData.reason || "other",
      details: reportData.details,
      reportedAt: new Date(),
    };

    await Comment.findByIdAndUpdate(commentId, {
      $push: { reports: report },
      $inc: { reportCount: 1 },
    });

    // Notify admins if report count exceeds threshold
    if (comment.reportCount + 1 >= 3) {
      const User = require("../models/User");
      const admins = await User.find({ role: "super_admin" }).select("_id");

      for (const admin of admins) {
        await Notification.create({
          recipient: admin._id,
          type: "comment-reported",
          title: "Comment flagged for review",
          message: `A comment has been reported ${comment.reportCount + 1} times`,
          entityType: "Comment",
          entityId: commentId,
        });
      }
    }
  } catch (error) {
    console.error("Error reporting comment:", error);
    throw error;
  }
}

// ==================== MODERATION SERVICES ====================

/**
 * Get flagged content for moderation (admin only)
 * @param {object} options - Filter options
 * @returns {Promise<object>} - Lists of flagged posts and comments
 */
async function getFlaggedContent(options = {}) {
  try {
    const { page = 1, limit = 20, type = "all" } = options; // type: post, comment, all
    const skip = (page - 1) * limit;

    const results = {};

    if (type === "post" || type === "all") {
      const [posts, postTotal] = await Promise.all([
        Post.find({ reportCount: { $gte: 1 } })
          .populate("author", "fullName email")
          .sort({ reportCount: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Post.countDocuments({ reportCount: { $gte: 1 } }),
      ]);

      results.posts = posts;
      results.postPagination = {
        page,
        limit,
        total: postTotal,
        pages: Math.ceil(postTotal / limit),
      };
    }

    if (type === "comment" || type === "all") {
      const [comments, commentTotal] = await Promise.all([
        Comment.find({ reportCount: { $gte: 1 } })
          .populate("author", "fullName email")
          .populate("post", "title")
          .sort({ reportCount: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Comment.countDocuments({ reportCount: { $gte: 1 } }),
      ]);

      results.comments = comments;
      results.commentPagination = {
        page,
        limit,
        total: commentTotal,
        pages: Math.ceil(commentTotal / limit),
      };
    }

    return results;
  } catch (error) {
    console.error("Error fetching flagged content:", error);
    throw error;
  }
}

/**
 * Approve/dismiss a flag on a post
 * @param {string} postId - Post ID
 * @param {string} action - "approve" or "dismiss"
 * @returns {Promise<void>}
 */
async function moderatePost(postId, action) {
  try {
    if (action === "approve") {
      // Delete the post
      await Post.findByIdAndUpdate(postId, {
        isDeleted: true,
        deletedAt: new Date(),
        isModerated: true,
      });
    } else if (action === "dismiss") {
      // Clear reports and mark as moderated
      await Post.findByIdAndUpdate(postId, {
        reports: [],
        reportCount: 0,
        isModerated: true,
      });
    }
  } catch (error) {
    console.error("Error moderating post:", error);
    throw error;
  }
}

/**
 * Approve/dismiss a flag on a comment
 * @param {string} commentId - Comment ID
 * @param {string} action - "approve" or "dismiss"
 * @returns {Promise<void>}
 */
async function moderateComment(commentId, action) {
  try {
    if (action === "approve") {
      // Delete the comment
      await Comment.findByIdAndUpdate(commentId, {
        isDeleted: true,
        deletedAt: new Date(),
        isModerated: true,
      });
    } else if (action === "dismiss") {
      // Clear reports and mark as moderated
      await Comment.findByIdAndUpdate(commentId, {
        reports: [],
        reportCount: 0,
        isModerated: true,
      });
    }
  } catch (error) {
    console.error("Error moderating comment:", error);
    throw error;
  }
}

/**
 * Format post for response
 * @param {object} post - Post document
 * @returns {object} - Formatted post
 */
function formatPost(post) {
  return {
    _id: post._id,
    id: post._id,
    author: post.author,
    title: post.title,
    content: post.content,
    category: post.category,
    tags: post.tags,
    images: (post.images || []).map((imageUrl) =>
      transformImageUrl(imageUrl, { width: 1280, height: 960, crop: "fill" })
    ),
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    viewCount: post.viewCount,
    reportCount: post.reportCount,
    isFeatured: post.isFeatured,
    isPinned: post.isPinned,
    isLocked: post.isLocked,
    approvalStatus: post.approvalStatus,
    approvedBy: post.approvedBy,
    approvedAt: post.approvedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

async function approveStoryPost(postId, approverId) {
  try {
    const post = await Post.findById(postId);

    if (!post) {
      throw new Error("Post not found");
    }

    post.approvalStatus = "approved";
    post.approvedBy = approverId;
    post.approvedAt = new Date();
    await post.save();

    await post.populate("author", "fullName profilePhoto role");
    return formatPost(post.toObject());
  } catch (error) {
    console.error("Error approving story post:", error);
    throw error;
  }
}

async function listPendingStoryPosts({ page = 1, limit = 20 } = {}) {
  try {
    const normalizedPage = Math.max(1, Number(page));
    const normalizedLimit = Math.min(50, Math.max(1, Number(limit)));
    const skip = (normalizedPage - 1) * normalizedLimit;

    const query = {
      category: "success-stories",
      approvalStatus: "pending_approval",
      isDeleted: false,
    };

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate("author", "fullName email profilePhoto role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(normalizedLimit)
        .lean(),
      Post.countDocuments(query),
    ]);

    return {
      posts: posts.map(formatPost),
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        pages: Math.ceil(total / normalizedLimit),
      },
    };
  } catch (error) {
    console.error("Error listing pending story posts:", error);
    throw error;
  }
}

/**
 * Check if user is moderator (admin or vet)
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
async function isUserModerator(userId) {
  try {
    const User = require("../models/User");
    const user = await User.findById(userId).select("role");
    return user && (user.role === "super_admin" || user.role === "veterinarian");
  } catch (error) {
    return false;
  }
}

module.exports = {
  // Post services
  createPost,
  getFeed,
  getPost,
  updatePost,
  deletePost,
  likePost,
  reportPost,

  // Comment services
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  reportComment,

  // Moderation services
  getFlaggedContent,
  moderatePost,
  moderateComment,

  // Utilities
  formatPost,
  approveStoryPost,
  listPendingStoryPosts,
};
