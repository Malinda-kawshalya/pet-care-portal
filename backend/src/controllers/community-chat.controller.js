const { z } = require("zod");
const CommunityMessage = require("../models/CommunityMessage");
const { emitCommunityChatMessage } = require("../realtime/socket.instance");

async function listCommunityChatMessagesHandler(req, res) {
  try {
    const messages = await CommunityMessage.find({ room: "main" })
      .populate("author", "fullName profilePhoto role")
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        messages: messages.map((message) => ({
          id: message._id,
          content: message.content,
          room: message.room,
          createdAt: message.createdAt,
          author: {
            id: message.author?._id,
            fullName: message.author?.fullName || "Community Member",
            profilePhoto: message.author?.profilePhoto || "",
            role: message.author?.role || "user",
          },
        })),
      },
    });
  } catch (error) {
    console.error("Error listing community chat messages:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching community chat messages",
      code: 500,
    });
  }
}

async function sendCommunityChatMessageHandler(req, res) {
  try {
    const schema = z.object({
      content: z.string().trim().min(1).max(1000),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0].message,
        code: 400,
      });
    }

    const message = await CommunityMessage.create({
      author: req.authUser._id,
      content: parsed.data.content,
      room: "main",
    });

    await message.populate("author", "fullName profilePhoto role");

    const payload = {
      id: message._id,
      content: message.content,
      room: message.room,
      createdAt: message.createdAt,
      author: {
        id: message.author?._id,
        fullName: message.author?.fullName || "Community Member",
        profilePhoto: message.author?.profilePhoto || "",
        role: message.author?.role || "user",
      },
    };

    emitCommunityChatMessage(payload);

    return res.status(201).json({
      success: true,
      message: "Message sent",
      data: {
        message: payload,
      },
    });
  } catch (error) {
    console.error("Error sending community chat message:", error);
    return res.status(500).json({
      success: false,
      message: "Error sending community chat message",
      code: 500,
    });
  }
}

module.exports = {
  listCommunityChatMessagesHandler,
  sendCommunityChatMessageHandler,
};