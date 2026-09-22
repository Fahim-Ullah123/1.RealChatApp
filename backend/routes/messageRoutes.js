import express from "express";
import { deleteMessage, getMessages, sendMessage } from "../controllers/messageController.js";
import isUser from "../middleware/isUser.js";
import { upload } from "../middleware/multer.js";

const messageRouter = express.Router();

messageRouter.get("/:receiverId", isUser, getMessages);
messageRouter.post("/:receiverId", isUser, upload.single("media"), sendMessage);
messageRouter.delete("/:messageId", isUser, deleteMessage);

export default messageRouter;
