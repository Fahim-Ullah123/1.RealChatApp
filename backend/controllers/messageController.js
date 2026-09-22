import mongoose from "mongoose";
import { deleteFromCloud, uploadMediaOnCloud } from "../config/cloudinary.js";
import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js";

const validUserId = (id) => mongoose.isValidObjectId(id);

export const getMessages = async (req, res) => {
  try {
    const receiverId = req.params.receiverId;

    if (!validUserId(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver" });
    }

    const conversation = await Conversation.findOne({
      participants: { $all: [req.userId, receiverId] },
    });

    if (!conversation) return res.status(200).json([]);

    const messages = await Message.find({ conversation: conversation._id })
      .sort({ createdAt: 1 })
      .populate("sender", "name username image")
      .populate("receiver", "name username image");

    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ message: "Could not load messages" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const receiverId = req.params.receiverId;
    const text = req.body.message?.trim() || "";

    if (!validUserId(receiverId) || receiverId === String(req.userId)) {
      return res.status(400).json({ message: "Invalid receiver" });
    }

    const receiver = await User.findById(receiverId).select("_id");
    if (!receiver) return res.status(404).json({ message: "Receiver not found" });
    if (!text && !req.file) {
      return res.status(400).json({ message: "A message or media file is required" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.userId, receiverId] },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.userId, receiverId],
      });
    }

    const media = { url: "", type: "", publicId: "", name: "" };
    if (req.file) {
      media.type = req.file.mimetype.startsWith("image/")
        ? "image"
        : req.file.mimetype.startsWith("video/")
          ? "video"
          : "document";
      const resourceType = media.type === "document" ? "raw" : media.type;
      const upload = await uploadMediaOnCloud(req.file.path, resourceType);
      media.url = upload.url;
      media.publicId = upload.publicId;
      media.name = req.file.originalname;
    }

    const newMessage = await Message.create({
      sender: req.userId,
      receiver: receiverId,
      message: text,
      conversation: conversation._id,
      media,
    });

    conversation.lastMessage = newMessage._id;
    await conversation.save();

    await newMessage.populate("sender", "name username image");
    await newMessage.populate("receiver", "name username image");
    req.app.get("io")?.to(String(receiverId)).emit("newMessage", newMessage);
    return res.status(201).json(newMessage);
  } catch (error) {
    console.error("Send message failed:", error.message);
    return res.status(500).json({
      message: error.message || "Could not send message",
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    if (!mongoose.isValidObjectId(messageId)) {
      return res.status(400).json({ message: "Invalid message" });
    }

    const message = await Message.findOne({ _id: messageId, sender: req.userId });
    if (!message) {
      return res.status(404).json({ message: "Message not found or cannot be deleted" });
    }

    if (message.media?.publicId) {
      const resourceType = message.media.type === "document" ? "raw" : message.media.type;
      await deleteFromCloud(message.media.publicId, resourceType);
    }

    await message.deleteOne();
    const conversation = await Conversation.findById(message.conversation);
    if (conversation?.lastMessage?.equals(message._id)) {
      const latestMessage = await Message.findOne({ conversation: conversation._id }).sort({ createdAt: -1 });
      conversation.lastMessage = latestMessage?._id || null;
      await conversation.save();
    }

    const io = req.app.get("io");
    io?.to(String(message.sender)).emit("messageDeleted", message._id.toString());
    io?.to(String(message.receiver)).emit("messageDeleted", message._id.toString());

    return res.status(200).json({ message: "Message deleted", messageId });
  } catch (error) {
    console.error("Delete message failed:", error.message);
    return res.status(500).json({ message: "Could not delete message" });
  }
};
