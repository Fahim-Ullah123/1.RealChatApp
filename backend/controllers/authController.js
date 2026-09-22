import { uploadOnCloud } from "../config/cloudinary.js";
import User from "../models/userModel.js";

export const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.userId;
    let user = await User.findById(userId).select("-password");
    if (!user) {
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(400).json({ message: "current user error " });
  }
};

export const editProfile = async (req, res) => {
  try {
    let { name } = req.body;
    const updates = { name };
    if (req.file) {
      updates.image = await uploadOnCloud(req.file.path);
    }
    let user = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password");
    if (!user) {
      return res.status(400).json({ message: "user is not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(400).json({
      message: " profile error",
    });
  }
};

export const getOtherUsers = async (req, res) => {
  try {
    let users = await User.find({
      _id: { $ne: req.userId },
    }).select("-password");
    return res.status(200).json(users);
  } catch (error) {
    return res.status(400).json({ message: "get other user error" });
  }
};
