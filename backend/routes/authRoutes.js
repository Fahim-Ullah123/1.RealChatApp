import express from "express";
import isUser from "../middleware/isUser.js";
import {
  editProfile,
  getCurrentUser,
  getOtherUsers,
} from "../controllers/authController.js";
import { upload } from "../middleware/multer.js";

const authrouter = express.Router();

authrouter.get("/current", isUser, getCurrentUser);
authrouter.get("/others", isUser, getOtherUsers);
authrouter.put("/profile", isUser, upload.single("image"), editProfile);

export default authrouter;
