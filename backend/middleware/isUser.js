import jwt from "jsonwebtoken";

const isUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: "User is not authenticated",
      });
    }

    const verifyToken = jwt.verify(token, process.env.JWT_SECRET_KEY);

    req.userId = verifyToken.userId;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

export default isUser;