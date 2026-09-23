import bcrypt from "bcryptjs";
import User from "../models/userModel.js";
import gentoken from "../config/userToken.js";

export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "all fields are required" });
    }
    const checkbyusername = await User.findOne({ username });
    if (checkbyusername) {
      return res.status(400).json({ message: "username already exist" });
    }
    const checkuserbyemail = await User.findOne({ email });
    if (checkuserbyemail) {
      return res.status(400).json({ message: "email already exist" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "password must be greater then 6 characters" });
    }

    const hashedpassowrd = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedpassowrd,
    });

    const token = await gentoken(user.id);
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "Strict",
      secure: false,
    });

    return res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: "signup error" });
  }
};

// login page==========================================================================================

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "all fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "user doesn't exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "incorrect password" });
    }

    const token = await gentoken(user.id);
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite:"Strict",
      secure: false,
    });

    return res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: "login error" });
  }
};

// logout----=======================================================================================

export const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({ message: "logout successfully" });
  } catch (error) {
    res.status(400).json({ message: "logout error" });
  }
};
