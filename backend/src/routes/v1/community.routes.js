const { Router } = require("express");
const Post = require("../../models/Post");
const {
  createPostHandler,
  getFeedHandler,
  getPostHandler,
  updatePostHandler,
  deletePostHandler,
  togglePostLikeHandler,
  reportPostHandler,
  getPostCommentsHandler,
  createCommentHandler,
  updateCommentHandler,
  deleteCommentHandler,
  toggleCommentLikeHandler,
  reportCommentHandler,
  getFlaggedContentHandler,
  moderatePostHandler,
  moderateCommentHandler,
  approveStoryPostHandler,
  listPendingStoryPostsHandler,
} = require("../../controllers/community.controller");
const {
  listCommunityChatMessagesHandler,
  sendCommunityChatMessageHandler,
} = require("../../controllers/community-chat.controller");
const { requireAuth } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/rbac.middleware");
const { USER_ROLES } = require("../../constants/roles");

const router = Router();

router.get("/feed", requireAuth, getFeedHandler);
router.get("/posts", requireAuth, getFeedHandler);
router.get("/posts/:postId", requireAuth, getPostHandler);
router.post("/posts", requireAuth, createPostHandler);
router.patch("/posts/:postId", requireAuth, updatePostHandler);
router.delete("/posts/:postId", requireAuth, deletePostHandler);
router.post("/posts/:postId/like", requireAuth, togglePostLikeHandler);
router.post("/posts/:postId/report", requireAuth, reportPostHandler);

router.post("/posts/:postId/share", async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findByIdAndUpdate(
      postId,
      { $inc: { shareCount: 1 } },
      { new: true }
    );
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }
    return res.status(200).json({ success: true, data: { post } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/posts/:postId/comments", requireAuth, getPostCommentsHandler);
router.post("/posts/:postId/comments", requireAuth, createCommentHandler);
router.patch("/comments/:commentId", requireAuth, updateCommentHandler);
router.delete("/comments/:commentId", requireAuth, deleteCommentHandler);
router.post("/comments/:commentId/like", requireAuth, toggleCommentLikeHandler);
router.post("/comments/:commentId/report", requireAuth, reportCommentHandler);

router.get("/chat/messages", requireAuth, listCommunityChatMessagesHandler);
router.post("/chat/messages", requireAuth, sendCommunityChatMessageHandler);

router.get("/moderation/flagged", requireAuth, requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), getFlaggedContentHandler);
router.get("/moderation/stories/pending", requireAuth, requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), listPendingStoryPostsHandler);
router.post("/moderation/posts/:postId", requireAuth, requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), moderatePostHandler);
router.post("/moderation/comments/:commentId", requireAuth, requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), moderateCommentHandler);
router.post("/posts/:postId/approve", requireAuth, requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), approveStoryPostHandler);

module.exports = router;
