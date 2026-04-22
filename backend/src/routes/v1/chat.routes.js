const { Router } = require("express");
const { requireAuth } = require("../../middleware/auth.middleware");
const {
  listConversationsHandler,
  getConversationMessagesHandler,
  sendMessageHandler,
} = require("../../controllers/chat.controller");

const router = Router();

router.use(requireAuth);

router.get("/conversations", listConversationsHandler);
router.get("/conversations/:conversationId/messages", getConversationMessagesHandler);
router.post("/message", sendMessageHandler);

module.exports = router;
