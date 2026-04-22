const { z } = require("zod");
const ChatConversation = require("../models/ChatConversation");
const ChatMessage = require("../models/ChatMessage");
const {
  DAILY_CHAT_LIMIT,
  generateAssistantReply,
  generateFallbackAssistantReply,
  getStartOfToday,
} = require("../services/chat.service");

async function listConversationsHandler(req, res) {
  try {
    const conversations = await ChatConversation.find({
      user: req.authUser._id,
      isArchived: false,
    })
      .sort({ updatedAt: -1 })
      .limit(30)
      .lean();

    return res.status(200).json({
      success: true,
      data: { conversations },
    });
  } catch (error) {
    console.error("Error listing conversations:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching conversations",
      code: 500,
    });
  }
}

async function getConversationMessagesHandler(req, res) {
  try {
    const { conversationId } = req.params;

    const conversation = await ChatConversation.findOne({
      _id: conversationId,
      user: req.authUser._id,
      isArchived: false,
    }).lean();

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
        code: 404,
      });
    }

    const messages = await ChatMessage.find({
      conversation: conversationId,
      user: req.authUser._id,
    })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        conversation,
        messages,
      },
    });
  } catch (error) {
    console.error("Error fetching conversation messages:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching conversation messages",
      code: 500,
    });
  }
}

async function sendMessageHandler(req, res) {
  try {
    const schema = z.object({
      message: z.string().trim().min(1).max(2000),
      conversationId: z.string().optional(),
      images: z
        .array(
          z.object({
            mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
            dataBase64: z.string().min(100).max(4_500_000),
          })
        )
        .max(3)
        .optional()
        .default([]),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0].message,
        code: 400,
      });
    }

    const { message, conversationId, images } = parsed.data;

    const usedToday = await ChatMessage.countDocuments({
      user: req.authUser._id,
      role: "user",
      createdAt: { $gte: getStartOfToday() },
    });

    if (usedToday >= DAILY_CHAT_LIMIT) {
      return res.status(429).json({
        success: false,
        message: "Daily chat limit reached (50 messages/day)",
        code: 429,
        data: {
          remainingMessages: 0,
          dailyLimit: DAILY_CHAT_LIMIT,
        },
      });
    }

    let conversation = null;

    if (conversationId) {
      conversation = await ChatConversation.findOne({
        _id: conversationId,
        user: req.authUser._id,
        isArchived: false,
      });
    }

    if (!conversation) {
      conversation = await ChatConversation.create({
        user: req.authUser._id,
        title: message.slice(0, 60),
      });
    }

    await ChatMessage.create({
      conversation: conversation._id,
      user: req.authUser._id,
      role: "user",
      content: images.length ? `${message}\n[Attached images: ${images.length}]` : message,
    });

    const history = await ChatMessage.find({
      conversation: conversation._id,
      user: req.authUser._id,
    })
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    const orderedHistory = history.reverse().map((item) => ({
      role: item.role,
      content: item.content,
    }));

    let result;

    try {
      result = await generateAssistantReply({
        userMessage: message,
        images,
        history: orderedHistory,
        userContext: {
          fullName: req.authUser.fullName,
          role: req.authUser.role,
        },
      });
    } catch (aiError) {
      console.error("Chat AI generation failed, using fallback:", aiError);
      result = {
        reply: generateFallbackAssistantReply(message),
        outOfScope: false,
      };
    }

    const assistantMessage = await ChatMessage.create({
      conversation: conversation._id,
      user: req.authUser._id,
      role: "assistant",
      content: result.reply,
    });

    conversation.lastMessage = result.reply.slice(0, 500);
    if (conversation.title === "New Chat") {
      conversation.title = message.slice(0, 60);
    }
    await conversation.save();

    return res.status(200).json({
      success: true,
      data: {
        conversation,
        message: assistantMessage,
        reply: result.reply,
        outOfScope: result.outOfScope,
        remainingMessages: DAILY_CHAT_LIMIT - (usedToday + 1),
        dailyLimit: DAILY_CHAT_LIMIT,
      },
    });
  } catch (error) {
    console.error("Error sending chat message:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing chat message",
      code: 500,
    });
  }
}

module.exports = {
  listConversationsHandler,
  getConversationMessagesHandler,
  sendMessageHandler,
};
